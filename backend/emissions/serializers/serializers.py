from rest_framework import serializers
from emissions.models import Company, DataSource, EmissionRecord, AuditLog

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'created_at']


class DataSourceSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    records_count = serializers.SerializerMethodField()
    suspicious_count = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = [
            'id',
            'company',
            'company_name',
            'source_type',
            'file_name',
            'uploaded_at',
            'records_count',
            'suspicious_count',
        ]

    def get_records_count(self, obj):
        return obj.emission_records.count()

    def get_suspicious_count(self, obj):
        return obj.emission_records.filter(is_suspicious=True).count()



class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'record', 'action', 'old_value', 'new_value', 'performed_by', 'timestamp']


class EmissionRecordSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    source_type = serializers.ReadOnlyField(source='source.source_type')
    audit_logs = AuditLogSerializer(many=True, read_only=True)

    class Meta:
        model = EmissionRecord
        fields = [
            'id',
            'company',
            'company_name',
            'source',
            'source_type',
            'scope',
            'category',
            'activity_type',
            'raw_value',
            'raw_unit',
            'normalized_value',
            'normalized_unit',
            'status',
            'is_suspicious',
            'created_at',
            'audit_logs',
        ]
