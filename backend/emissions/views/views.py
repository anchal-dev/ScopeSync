from rest_framework import views, viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action
from emissions.models import Company, DataSource, EmissionRecord, AuditLog
from emissions.serializers import DataSourceSerializer, EmissionRecordSerializer, AuditLogSerializer
from emissions.services.ingestion import ingest_csv
from decimal import Decimal

def get_or_create_default_company(request):
    """
    Helper to resolve the tenant company.
    Checks 'X-Company-ID' header, otherwise falls back to first company,
    or creates a default 'Acme Corporation' company.
    """
    company_id = request.headers.get('X-Company-ID')
    if company_id:
        try:
            return Company.objects.get(id=company_id)
        except (Company.DoesNotExist, ValueError):
            pass
            
    company = Company.objects.first()
    if not company:
        company = Company.objects.create(name="Acme Corporation Ltd.")
    return company

class BaseUploadView(views.APIView):
    parser_classes = [MultiPartParser]
    source_type = None  # to be overridden

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response(
                {"error": "No file was uploaded. Key 'file' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        file_obj = request.FILES['file']
        if not file_obj.name.endswith('.csv'):
            return Response(
                {"error": "Unsupported file format. Only CSV files are supported."},
                status=status.HTTP_400_BAD_REQUEST
            )

        company = get_or_create_default_company(request)

        try:
            datasource, count, suspicious = ingest_csv(
                company_id=company.id,
                source_type=self.source_type,
                file_obj=file_obj,
                file_name=file_obj.name
            )
            
            return Response({
                "message": "Ingestion completed successfully.",
                "source": DataSourceSerializer(datasource).data,
                "records_created": count,
                "suspicious_records_flagged": suspicious
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "An internal error occurred during CSV parsing.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UploadSAPView(BaseUploadView):
    source_type = 'SAP'

class UploadUtilityView(BaseUploadView):
    source_type = 'UTILITY'

class UploadTravelView(BaseUploadView):
    source_type = 'TRAVEL'

class EmissionRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, approving, rejecting, and editing emission records.
    """
    serializer_class = EmissionRecordSerializer
    queryset = EmissionRecord.objects.all()

    def get_queryset(self):
        # Enforce multi-tenant scoping
        company = get_or_create_default_company(self.request)
        queryset = EmissionRecord.objects.filter(company=company)

        # Filters
        scope = self.request.query_params.get('scope')
        status_param = self.request.query_params.get('status')
        is_suspicious = self.request.query_params.get('is_suspicious')

        if scope:
            queryset = queryset.filter(scope=scope)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if is_suspicious:
            queryset = queryset.filter(is_suspicious=is_suspicious.lower() == 'true')

        return queryset

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        record = self.get_object()
        old_status = record.status
        
        if record.status == 'Approved':
            return Response({"message": "Record is already Approved."}, status=status.HTTP_200_OK)
            
        record.status = 'Approved'
        record.save()

        # Audit Log
        AuditLog.objects.create(
            record=record,
            action='Approved',
            old_value=f"Status: {old_status}",
            new_value="Status: Approved",
            performed_by=request.headers.get('X-User', 'Analyst')
        )

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        record = self.get_object()
        old_status = record.status
        
        if record.status == 'Rejected':
            return Response({"message": "Record is already Rejected."}, status=status.HTTP_200_OK)
            
        record.status = 'Rejected'
        record.save()

        # Audit Log
        AuditLog.objects.create(
            record=record,
            action='Rejected',
            old_value=f"Status: {old_status}",
            new_value="Status: Rejected",
            performed_by=request.headers.get('X-User', 'Analyst')
        )

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def edit(self, request, pk=None):
        record = self.get_object()
        
        new_val_str = request.data.get('normalized_value')
        new_unit = request.data.get('normalized_unit')
        
        if not new_val_str and not new_unit:
            return Response(
                {"error": "Please provide 'normalized_value' or 'normalized_unit' to edit."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        old_val_log = f"Value: {record.normalized_value} {record.normalized_unit}"
        
        # Apply edits
        if new_val_str is not None:
            try:
                record.normalized_value = Decimal(str(new_val_str))
            except Exception:
                return Response({"error": "Invalid normalized_value format."}, status=status.HTTP_400_BAD_REQUEST)
                
        if new_unit is not None:
            record.normalized_unit = str(new_unit)
            
        record.save()
        
        new_val_log = f"Value: {record.normalized_value} {record.normalized_unit}"

        # Audit Log
        AuditLog.objects.create(
            record=record,
            action='Updated',
            old_value=old_val_log,
            new_value=new_val_log,
            performed_by=request.headers.get('X-User', 'Analyst')
        )

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)


class AuditLogListView(views.APIView):
    """Return all audit logs scoped to the current company."""

    def get(self, request):
        company = get_or_create_default_company(request)
        logs = AuditLog.objects.filter(record__company=company).select_related('record')
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StatsView(views.APIView):
    """Return live KPI counts for the dashboard."""

    def get(self, request):
        company = get_or_create_default_company(request)
        qs = EmissionRecord.objects.filter(company=company)
        total = qs.count()
        approved = qs.filter(status='Approved').count()
        pending = qs.filter(status='Pending').count()
        rejected = qs.filter(status='Rejected').count()
        suspicious = qs.filter(is_suspicious=True).count()

        # Database aggregations
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth

        def get_scope_sum(scope_name):
            totals = qs.filter(scope=scope_name).values('normalized_unit').annotate(s=Sum('normalized_value'))
            total_co2e = 0.0
            for item in totals:
                unit = (item['normalized_unit'] or '').lower()
                val = float(item['s'] or 0)
                if unit in ['l', 'liters']: total_co2e += val * 0.00268
                elif unit in ['kwh']: total_co2e += val * 0.0004
                elif unit in ['km']: total_co2e += val * 0.00017
                elif unit in ['tco2e']: total_co2e += val
                elif unit in ['gj']: total_co2e += val * 0.05
                else: total_co2e += val * 0.001
            return total_co2e

        scope1_sum = get_scope_sum('Scope 1')
        scope2_sum = get_scope_sum('Scope 2')
        scope3_sum = get_scope_sum('Scope 3')

        # Monthly trends
        trend_qs = (
            qs.annotate(month_date=TruncMonth('created_at'))
            .values('month_date', 'scope', 'normalized_unit')
            .annotate(value_sum=Sum('normalized_value'))
            .order_by('month_date')
        )

        months_data = {}
        # Order of months for sorting if needed, or we just append
        for item in trend_qs:
            month_date = item.get('month_date')
            if not month_date:
                continue
            month_str = month_date.strftime('%b')  # e.g. "Jan", "Feb"
            if month_str not in months_data:
                months_data[month_str] = {
                    'month': month_str,
                    'scope1': 0.0,
                    'scope2': 0.0,
                    'scope3': 0.0,
                    'month_date': month_date,
                }
            scope = item.get('scope')
            val = float(item.get('value_sum') or 0)
            unit = (item.get('normalized_unit') or '').lower()
            
            if unit in ['l', 'liters']: val *= 0.00268
            elif unit in ['kwh']: val *= 0.0004
            elif unit in ['km']: val *= 0.00017
            elif unit in ['tco2e']: val *= 1.0
            elif unit in ['gj']: val *= 0.05
            else: val *= 0.001
            
            if scope == 'Scope 1':
                months_data[month_str]['scope1'] += val
            elif scope == 'Scope 2':
                months_data[month_str]['scope2'] += val
            elif scope == 'Scope 3':
                months_data[month_str]['scope3'] += val

        # Sort trend list by month_date
        trend_list = sorted(months_data.values(), key=lambda x: x['month_date'])
        for t in trend_list:
            t.pop('month_date', None)

        return Response({
            'total': total,
            'approved': approved,
            'pending': pending,
            'rejected': rejected,
            'suspicious': suspicious,
            'scope_breakdown': {
                'Scope 1': qs.filter(scope='Scope 1').count(),
                'Scope 2': qs.filter(scope='Scope 2').count(),
                'Scope 3': qs.filter(scope='Scope 3').count(),
            },
            'emissions_sum': {
                'Scope 1': scope1_sum,
                'Scope 2': scope2_sum,
                'Scope 3': scope3_sum,
            },
            'emissions_trend': trend_list,
        }, status=status.HTTP_200_OK)



class DataSourceListView(views.APIView):
    """Return all uploaded data sources (ingestion batches) scoped to the current company."""

    def get(self, request):
        company = get_or_create_default_company(request)
        sources = DataSource.objects.filter(company=company)
        serializer = DataSourceSerializer(sources, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

