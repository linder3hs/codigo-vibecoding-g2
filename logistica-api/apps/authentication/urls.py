from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import UserManagementViewSet, GroupManagementViewSet, MeView, PermissionListView

router = DefaultRouter()
router.register(r'admin/users', UserManagementViewSet, basename='admin-user')
router.register(r'admin/groups', GroupManagementViewSet, basename='admin-group')

urlpatterns = [
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('admin/permissions/', PermissionListView.as_view(), name='admin-permissions'),
] + router.urls
