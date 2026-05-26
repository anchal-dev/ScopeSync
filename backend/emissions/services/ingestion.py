import io
import pandas as pd
from django.db import transaction
from emissions.models import Company, DataSource, EmissionRecord, AuditLog
from .normalization import normalize_row

def find_column(df, patterns):
    """
    Finds a column in df that matches any of the patterns (case-insensitive regex or substrings).
    """
    for col in df.columns:
        col_lower = str(col).lower().strip()
        for pattern in patterns:
            if pattern in col_lower:
                return col
    return None

def ingest_csv(company_id, source_type, file_obj, file_name):
    """
    Parses an uploaded CSV file using pandas, normalizes rows,
    saves the DataSource, creates EmissionRecords, and logs audits.
    Returns: (datasource_instance, created_count, suspicious_count)
    """
    # 1. Resolve Company (tenant)
    company = Company.objects.get(id=company_id)

    # 2. Read and decode content
    # CSV could have BOM or different encodings, utf-8-sig is safer
    content = file_obj.read()
    if isinstance(content, bytes):
        raw_str = content.decode('utf-8-sig', errors='ignore')
    else:
        raw_str = content

    # Preprocess to remove outer quote wrapping (e.g. "Col1,Col2,Col3")
    lines = raw_str.splitlines()
    processed_lines = []
    if lines:
        import csv
        header = lines[0].strip()
        is_wrapped = False
        if header.startswith('"') and header.endswith('"'):
            parsed = list(csv.reader([header]))
            if parsed and len(parsed[0]) == 1:
                is_wrapped = True
                
        if is_wrapped:
            for line in lines:
                line_str = line.strip()
                if line_str.startswith('"') and line_str.endswith('"'):
                    parsed = list(csv.reader([line_str]))
                    if parsed and len(parsed[0]) == 1:
                        processed_lines.append(parsed[0][0])
                    else:
                        processed_lines.append(line_str)
                else:
                    processed_lines.append(line_str)
        else:
            processed_lines = [line.strip() for line in lines]
    else:
        processed_lines = []

    # Detect delimiter (comma, semicolon, tab)
    sep = ','
    if processed_lines:
        header_line = processed_lines[0]
        comma_count = header_line.count(',')
        semicolon_count = header_line.count(';')
        tab_count = header_line.count('\t')
        if semicolon_count > comma_count and semicolon_count > tab_count:
            sep = ';'
        elif tab_count > comma_count and tab_count > semicolon_count:
            sep = '\t'

    file_data = io.StringIO('\n'.join(processed_lines))
    df = pd.read_csv(file_data, sep=sep)
    
    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]

    # 3. Explicitly map columns based on source_type
    def get_col(options):
        for opt in options:
            if opt in df.columns:
                return opt
        return options[0]

    if source_type == 'SAP':
        activity_col = get_col(['Fuel Type'])
        value_col = get_col(['Quantity'])
        unit_col = get_col(['Unit'])
        category_col = None
    elif source_type == 'UTILITY':
        activity_col = get_col(['Meter ID', 'Utility Type'])
        value_col = get_col(['kWh', 'Consumption'])
        unit_col = get_col(['UOM']) if 'UOM' in df.columns else None
        category_col = None
    elif source_type == 'TRAVEL':
        activity_col = get_col(['Mode', 'Travel Type'])
        value_col = get_col(['Distance'])
        unit_col = get_col(['Unit'])
        category_col = None
    else:
        # Fallback dynamic mapping if new types are added
        activity_col = find_column(df, ['activity', 'fuel', 'travel', 'type', 'description', 'meter', 'mode'])
        value_col = find_column(df, ['value', 'quantity', 'amount', 'consumption', 'val', 'distance', 'kwh'])
        unit_col = find_column(df, ['unit', 'uom', 'measure'])
        category_col = find_column(df, ['category', 'sector', 'group'])

    missing_cols = []
    if activity_col and activity_col not in df.columns: missing_cols.append(activity_col)
    if value_col and value_col not in df.columns: missing_cols.append(value_col)
    if unit_col and unit_col not in df.columns: missing_cols.append(unit_col)

    if missing_cols:
        raise ValueError(
            f"Missing required columns for {source_type}: {missing_cols}. "
            f"Detected: {list(df.columns)}."
        )

    created_records = []
    suspicious_count = 0

    with transaction.atomic():
        # 4. Save DataSource
        data_source = DataSource.objects.create(
            company=company,
            source_type=source_type,
            file_name=file_name
        )

        # 5. Iterate and normalize rows
        from .normalization import clean_value
        
        for _, row in df.iterrows():
            raw_act = str(row.get(activity_col, "")) if activity_col and pd.notna(row.get(activity_col)) else "Unknown Activity"
            raw_val = row.get(value_col)
            
            if source_type == 'UTILITY':
                raw_un = 'kWh'
            else:
                raw_un = str(row.get(unit_col, "")) if unit_col and pd.notna(row.get(unit_col)) else ""
                
            row_cat = str(row.get(category_col, "")) if category_col and pd.notna(row.get(category_col)) else None

            # Run normalization service
            scope, norm_cat, norm_val, norm_unit, is_suspicious = normalize_row(
                source_type=source_type,
                activity_type=raw_act,
                raw_val=raw_val,
                raw_unit=raw_un
            )
            
            parsed_raw_val, is_valid_val = clean_value(raw_val)
            
            if is_suspicious:
                suspicious_count += 1

            # Build Emission Record
            record = EmissionRecord(
                company=company,
                source=data_source,
                scope=scope,
                category=row_cat or norm_cat,
                activity_type=raw_act,
                raw_value=parsed_raw_val if is_valid_val else 0.0,
                raw_unit=raw_un or 'Unknown',
                normalized_value=norm_val,
                normalized_unit=norm_unit,
                status='Pending',
                is_suspicious=is_suspicious
            )
            created_records.append(record)

        # Bulk create EmissionRecords
        created_instances = EmissionRecord.objects.bulk_create(created_records)

        # 6. Generate Audit Logs in bulk
        audit_logs = [
            AuditLog(
                record=record,
                action='Created',
                old_value=None,
                new_value=f"Ingested from {source_type} batch. Scope: {record.scope}, Normalized: {record.normalized_value} {record.normalized_unit}, Suspicious: {record.is_suspicious}",
                performed_by='System Ingestion'
            )
            for record in created_instances
        ]
        AuditLog.objects.bulk_create(audit_logs)

    return data_source, len(created_instances), suspicious_count
