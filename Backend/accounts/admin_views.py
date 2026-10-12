"""Admin views for user management. Restricted to staff/superadmin."""

from django.contrib.auth import get_user_model
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsStaffOrSuperuser

from .admin_serializers import (
    AdminCreateEmployeeSerializer,
    AdminRoleAssignSerializer,
    AdminRoleRemoveSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
)
from .models import AccountStatus, EmployeeProfile, Role, UserRole
from .serializers import UserAddressSerializer
from .services import RoleService

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """List all users with search and filtering. Staff only."""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsStaffOrSuperuser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['phone_number', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'last_login', 'phone_number']
    ordering = ['-created_at']

    def get_queryset(self):
        return User.objects.all().select_related(
            'landlord_profile', 'tenant_profile', 'employee_profile'
        ).prefetch_related('roles')


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a user. Staff only."""
    queryset = User.objects.all()
    permission_classes = [IsStaffOrSuperuser]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer

    def get_queryset(self):
        return User.objects.all().select_related(
            'landlord_profile', 'tenant_profile', 'employee_profile'
        ).prefetch_related('roles', 'addresses')


class AdminUserStatusView(APIView):
    """Change a user's account status. Staff only."""
    permission_classes = [IsStaffOrSuperuser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'User not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('account_status')
        if new_status not in [s.value for s in AccountStatus]:
            return Response(
                {'error': {'code': 'invalid_status', 'message': 'Invalid account status.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent self-suspension
        if user == request.user and new_status == AccountStatus.SUSPENDED:
            return Response(
                {'error': {'code': 'self_suspend', 'message': 'You cannot suspend your own account.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = user.account_status
        user.account_status = new_status
        user.save(update_fields=['account_status', 'updated_at'])

        return Response({
            'detail': f'Account status changed from {old_status} to {new_status}.',
            'user': AdminUserDetailSerializer(user).data,
        })


class AdminRoleAssignView(APIView):
    """Assign a role to a user. Staff only."""
    permission_classes = [IsStaffOrSuperuser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'User not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminRoleAssignSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data['role']

        try:
            RoleService.assign_role(user, role, assigned_by=request.user)
        except PermissionError as exc:
            return Response(
                {'error': {'code': 'permission_denied', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({
            'detail': f'Role "{role}" assigned to {user.phone_number}.',
            'user': AdminUserDetailSerializer(user).data,
        })


class AdminRoleRemoveView(APIView):
    """Remove a role from a user. Staff only."""
    permission_classes = [IsStaffOrSuperuser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'User not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminRoleRemoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data['role']

        # Prevent removing your own last privileged role
        if user == request.user and role in RoleService.PRIVILEGED_ROLES:
            privileged_count = user.roles.filter(role__in=RoleService.PRIVILEGED_ROLES).count()
            if privileged_count <= 1:
                return Response(
                    {'error': {'code': 'self_remove', 'message': 'You cannot remove your own last privileged role.'}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        deleted, _ = UserRole.objects.filter(user=user, role=role).delete()
        if deleted == 0:
            return Response(
                {'error': {'code': 'no_role', 'message': 'User does not have this role.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'detail': f'Role "{role}" removed from {user.phone_number}.',
            'user': AdminUserDetailSerializer(user).data,
        })


class AdminCreateEmployeeView(APIView):
    """Create a new employee account. Staff only."""
    permission_classes = [IsStaffOrSuperuser]

    def post(self, request):
        serializer = AdminCreateEmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            phone_number=data['phone_number'],
            email=data.get('email') or None,
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            account_status=AccountStatus.ACTIVE,
        )
        RoleService.assign_role(user, Role.EMPLOYEE, assigned_by=request.user)

        EmployeeProfile.objects.create(
            user=user,
            employee_code=data['employee_code'],
            department=data['department'],
            designation=data['designation'],
            service_area=data.get('service_area', ''),
        )

        return Response({
            'detail': 'Employee account created successfully.',
            'user': AdminUserDetailSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminAddressCreateView(generics.CreateAPIView):
    """Add an address to a user. Staff only."""
    serializer_class = UserAddressSerializer
    permission_classes = [IsStaffOrSuperuser]

    def perform_create(self, serializer):
        user_pk = self.kwargs.get('pk')
        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'User not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer.save(user=user)


class AdminAddressUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a user address. Staff only."""
    serializer_class = UserAddressSerializer
    permission_classes = [IsStaffOrSuperuser]

    def get_queryset(self):
        from .models import UserAddress
        return UserAddress.objects.filter(user_id=self.kwargs.get('pk'))
