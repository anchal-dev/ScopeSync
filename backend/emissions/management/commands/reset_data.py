from django.core.management.base import BaseCommand
from emissions.models import EmissionRecord, AuditLog, DataSource

class Command(BaseCommand):
    help = 'Deletes all ingested records, audit logs, and data sources to reset the environment.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting all EmissionRecords...")
        er_count, _ = EmissionRecord.objects.all().delete()
        
        self.stdout.write("Deleting all AuditLogs...")
        al_count, _ = AuditLog.objects.all().delete()
        
        self.stdout.write("Deleting all DataSources...")
        ds_count, _ = DataSource.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(f"Successfully deleted {er_count} records, {al_count} logs, and {ds_count} sources."))
