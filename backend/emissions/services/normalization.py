import re
import math
from decimal import Decimal

def clean_unit(unit_str):
    if not unit_str or not isinstance(unit_str, str):
        return ""
    return unit_str.strip().lower()

def clean_value(val):
    if val is None:
        return None, False
    try:
        # Convert to float first, handling strings
        if isinstance(val, str):
            val = val.replace(',', '').strip()
            if not val:
                return None, False
        f_val = float(val)
        if math.isnan(f_val):
            return None, False
        return f_val, True
    except (ValueError, TypeError):
        return None, False

def normalize_row(source_type, activity_type, raw_val, raw_unit):
    """
    Normalizes a single row of emission activity data.
    Returns: (scope, category, normalized_value, normalized_unit, is_suspicious)
    """
    val, is_valid = clean_value(raw_val)
    unit = clean_unit(raw_unit)
    activity = (activity_type or "").strip()
    activity_lower = activity.lower()
    
    is_suspicious = False
    
    # ── Suspicious detection pre-checks ───────────────────────────────────────
    if not is_valid or val is None:
        is_suspicious = True
        val = 0.0
    elif val < 0:
        is_suspicious = True
    elif val > 10000000: # Impossible huge quantity rule
        is_suspicious = True
        
    if not unit:
        is_suspicious = True

    scope = "Scope 3"  # default fallback
    category = "Other"
    norm_val = val
    norm_unit = raw_unit or "Unknown"

    # ── Source Type Normalization & Scope Categorization ──────────────────────
    if source_type == 'SAP':
        # SAP Fuel is typically Scope 1 (Direct fuel combustion)
        scope = "Scope 1"
        category = "Stationary / Mobile Combustion"
        
        # Unit Normalization (gallons -> liters, etc.)
        if unit in ['gal', 'gals', 'gallon', 'gallons']:
            norm_val = val * 3.78541
            norm_unit = 'L'
        elif unit in ['l', 'liters', 'litre', 'litres', 'liter']:
            norm_val = val
            norm_unit = 'L'
        elif unit in ['gj', 'gigajoules', 'gigajoule']:
            norm_val = val
            norm_unit = 'GJ'
        else:
            # Check for any other direct combustion fuel units like tonnes, kg, etc.
            norm_unit = raw_unit.upper() if raw_unit else 'L'

    elif source_type == 'UTILITY':
        # Utility Electricity is Scope 2
        scope = "Scope 2"
        category = "Purchased Electricity"
        
        if unit in ['kwh', 'kilowatt-hour', 'kilowatt hour', 'kilowatt-hours']:
            norm_val = val
            norm_unit = 'kWh'
        elif unit in ['mwh', 'megawatt-hour', 'megawatt hour', 'megawatt-hours']:
            norm_val = val * 1000.0
            norm_unit = 'kWh'
        elif unit in ['wh', 'watt-hour', 'watt hour', 'watt-hours']:
            norm_val = val / 1000.0
            norm_unit = 'kWh'
        else:
            norm_unit = 'kWh'
            is_suspicious = True

    elif source_type == 'TRAVEL':
        # Corporate Travel is Scope 3
        scope = "Scope 3"
        
        if 'flight' in activity_lower or 'air' in activity_lower:
            category = "Business Travel — Flights"
        elif 'hotel' in activity_lower or 'stay' in activity_lower:
            category = "Business Travel — Hotel Stays"
        else:
            category = "Business Travel — Ground Transport"
            
        # Normalize miles to km, rooms/nights to nights, etc.
        if unit in ['mi', 'mile', 'miles']:
            norm_val = val * 1.60934
            norm_unit = 'km'
        elif unit in ['km', 'kms', 'kilometer', 'kilometers']:
            norm_val = val
            norm_unit = 'km'
        elif unit in ['tco2e', 'co2e', 'kgco2e']:
            norm_val = val
            norm_unit = 'tCO2e'
        elif unit in ['night', 'nights', 'room-night', 'room nights']:
            norm_val = val
            norm_unit = 'nights'
        else:
            norm_unit = raw_unit or 'km'

    # Round normalized value to 4 decimal places
    norm_val = round(norm_val, 4)

    return scope, category, Decimal(str(norm_val)), norm_unit, is_suspicious
