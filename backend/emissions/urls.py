from django.urls import path, include
from rest_framework.routers import DefaultRouter
from emissions.views import (
    UploadSAPView,
    UploadUtilityView,
    UploadTravelView,
    EmissionRecordViewSet,
    AuditLogListView,
    StatsView,
    DataSourceListView,
)

router = DefaultRouter(trailing_slash=False)
router.register(r'records', EmissionRecordViewSet, basename='record')

urlpatterns = [
    # Upload APIs
    path('upload/sap', UploadSAPView.as_view(), name='upload-sap'),
    path('upload/utility', UploadUtilityView.as_view(), name='upload-utility'),
    path('upload/travel', UploadTravelView.as_view(), name='upload-travel'),

    # Data sources list
    path('data-sources', DataSourceListView.as_view(), name='data-sources'),

    # Audit Logs
    path('audit-logs', AuditLogListView.as_view(), name='audit-logs'),

    # Dashboard stats
    path('stats', StatsView.as_view(), name='stats'),

    # Record CRUD + approve/reject/edit (DRF router)
    path('', include(router.urls)),
]

