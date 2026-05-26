import os
import django
import sys

# Configure Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "scopesync.settings")
django.setup()

from django.test import Client
from emissions.models import Company, DataSource, EmissionRecord, AuditLog

def run_test():
    print("=== ScopeSync Backend Integration Test ===")
    
    # 1. Ensure a default company exists
    company, created = Company.objects.get_or_create(name="Acme Corporation Ltd.")
    print(f"Company: {company.name} (Created: {created})")

    client = Client()

    # 2. Test Ingestion Uploads
    uploads = [
        ('/api/upload/sap', 'sap_fuel.csv'),
        ('/api/upload/utility', 'utility_electricity.csv'),
        ('/api/upload/travel', 'travel_data.csv'),
    ]

    for endpoint, filename in uploads:
        filepath = os.path.join('sample_data', filename)
        if not os.path.exists(filepath):
            print(f"Error: Sample file {filepath} not found.")
            continue
            
        print(f"\nIngesting {filename} via {endpoint}...")
        with open(filepath, 'rb') as f:
            response = client.post(endpoint, {'file': f}, HTTP_X_COMPANY_ID=str(company.id))
            
        print(f"Status Code: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Response: {data['message']}")
            print(f"Records Created: {data['records_created']}")
            print(f"Suspicious Flagged: {data['suspicious_records_flagged']}")
        else:
            print(f"Error Response: {response.json()}")

    # Test 2b. Outer Quote Wrapped CSV Ingestion
    print("\n=== Testing Outer Quote Wrapped CSV Ingestion ===")
    wrapped_csv_content = (
        '"Plant,Fuel Type,Quantity,Unit,Posting Date"\n'
        '"Delhi Plant,Diesel,500,Liters,2026-05-20"\n'
        '"Mumbai Plant,Petrol,100,Gallons,20/05/2026"\n'
    )
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False, mode='w', encoding='utf-8') as tf:
        tf.write(wrapped_csv_content)
        tf_name = tf.name

    try:
        with open(tf_name, 'rb') as f:
            response = client.post('/api/upload/sap', {'file': f}, HTTP_X_COMPANY_ID=str(company.id))
        print(f"Status Code (Wrapped CSV): {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Response: {data['message']}")
            print(f"Records Created: {data['records_created']}")
        else:
            print(f"Error Response: {response.json()}")
    finally:
        os.remove(tf_name)

    # Test 2c. Semicolon Separated CSV Ingestion
    print("\n=== Testing Semicolon Separated CSV Ingestion ===")
    semicolon_csv_content = (
        "Fuel Type;Quantity;Unit;Facility\n"
        "Diesel;600;L;Plant C - Berlin\n"
        "Petrol;150;gallons;Plant D - Rome\n"
    )
    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False, mode='w', encoding='utf-8') as tf:
        tf.write(semicolon_csv_content)
        tf_name = tf.name

    try:
        with open(tf_name, 'rb') as f:
            response = client.post('/api/upload/sap', {'file': f}, HTTP_X_COMPANY_ID=str(company.id))
        print(f"Status Code (Semicolon CSV): {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Response: {data['message']}")
            print(f"Records Created: {data['records_created']}")
        else:
            print(f"Error Response: {response.json()}")
    finally:
        os.remove(tf_name)

    # 3. Test Records Listing API
    print("\nQuerying ingested records via GET /api/records...")
    response = client.get('/api/records', HTTP_X_COMPANY_ID=str(company.id))
    print(f"Status Code: {response.status_code}")
    records = response.json()
    print(f"Total records in database: {len(records['results'])}")

    # 4. Test Suspicious Records
    suspicious_count = EmissionRecord.objects.filter(is_suspicious=True).count()
    print(f"Total Suspicious records flagged: {suspicious_count}")
    for r in EmissionRecord.objects.filter(is_suspicious=True):
        print(f"  - Flagged: {r.activity_type} | raw_value: {r.raw_value} {r.raw_unit} | is_suspicious: {r.is_suspicious}")

    # 5. Test Audit Logs
    audit_count = AuditLog.objects.count()
    print(f"\nTotal Audit Logs created: {audit_count}")
    print("Latest 3 Audit Logs:")
    for a in AuditLog.objects.all()[:3]:
        print(f"  - {a.action} by {a.performed_by} at {a.timestamp.strftime('%H:%M:%S')}")
        print(f"    Detail: {a.new_value or a.old_value}")

    print("\n=== Integration Test Finished Successfully! ===")

if __name__ == "__main__":
    run_test()
