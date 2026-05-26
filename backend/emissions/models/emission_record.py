from django.db import models
from .company import Company
from .data_source import DataSource

class EmissionRecord(models.Model):
    SCOPE_CHOICES = [
        ('Scope 1', 'Scope 1'),
        ('Scope 2', 'Scope 2'),
        ('Scope 3', 'Scope 3'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='emission_records')
    source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='emission_records')
    
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    category = models.CharField(max_length=100, blank=True, null=True)
    activity_type = models.CharField(max_length=150)
    
    raw_value = models.DecimalField(max_digits=18, decimal_places=4)
    raw_unit = models.CharField(max_length=50)
    
    normalized_value = models.DecimalField(max_digits=18, decimal_places=4)
    normalized_unit = models.CharField(max_length=50)
    
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Pending')
    is_suspicious = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'emission_records'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.activity_type}: {self.normalized_value} {self.normalized_unit} ({self.status})"
