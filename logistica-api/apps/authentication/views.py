from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class FlexiblePageSizePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 500

from .permissions import IsSuperAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    PermissionSerializer,
    GroupSerializer,
    GroupWriteSerializer,
    GroupAssignPermissionsSerializer,
    UserReadSerializer,
    UserWriteSerializer,
    UserAssignGroupsSerializer,
    MeUpdateSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MeUpdateSerializer
        return UserReadSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class PermissionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = PermissionSerializer
    pagination_class = FlexiblePageSizePagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'codename', 'content_type__app_label', 'content_type__model']
    ordering_fields = ['content_type__app_label', 'name']
    ordering = ['content_type__app_label', 'name']

    def get_queryset(self):
        return Permission.objects.select_related('content_type').all()


class UserManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.all().prefetch_related('groups').order_by('id')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_superuser', 'groups']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['id', 'username', 'date_joined']

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return UserReadSerializer
        return UserWriteSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'detail': 'No puedes eliminar tu propio usuario.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='assign-groups')
    def assign_groups(self, request, pk=None):
        user = self.get_object()
        serializer = UserAssignGroupsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.groups.set(serializer.validated_data['group_ids'])
        return Response(UserReadSerializer(user).data)


class GroupManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    pagination_class = FlexiblePageSizePagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']

    def get_queryset(self):
        return Group.objects.prefetch_related('permissions__content_type').order_by('name')

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return GroupSerializer
        return GroupWriteSerializer

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions(self, request, pk=None):
        group = self.get_object()
        serializer = GroupAssignPermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group.permissions.set(serializer.validated_data['permission_ids'])
        return Response(GroupSerializer(group).data)
