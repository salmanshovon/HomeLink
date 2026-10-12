"""Accounts views: registration, auth, verification, password reset, me."""

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.utils import normalize_bd_phone

from .models import AccountStatus, LandlordProfile, PhoneOTP, Role, TenantProfile
from .serializers import (
    LandlordProfileSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PhoneVerifySerializer,
    RegisterLandlordSerializer,
    RegisterTenantSerializer,
    ResendVerificationSerializer,
    TenantProfileSerializer,
    UserSerializer,
)
from .services import OTPService, RoleService

User = get_user_model()


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer  # noqa: E402


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Authenticate with phone number + password."""

    username_field = 'phone_number'

    def validate(self, attrs):
        # Normalize the phone number to match the stored E.164 value.
        phone = normalize_bd_phone(attrs.get('phone_number') or '')
        if phone:
            attrs['phone_number'] = phone
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Blacklist the provided refresh token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response(
                {'error': {'code': 'refresh_required', 'message': 'A refresh token is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


class RegisterTenantView(generics.CreateAPIView):
    serializer_class = RegisterTenantSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            phone_number=data['phone_number'],
            email=data.get('email') or None,
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            account_status=AccountStatus.PENDING,
        )
        RoleService.assign_role(user, Role.TENANT)
        TenantProfile.objects.create(
            user=user,
            full_name=data.get('full_name') or data.get('first_name', ''),
            occupation=data.get('occupation', ''),
            organization=data.get('organization', ''),
            emergency_contact=data.get('emergency_contact', ''),
        )
        OTPService.send(user, PhoneOTP.Purpose.PHONE_VERIFICATION)

        return Response(
            {
                'user': UserSerializer(user).data,
                'message': 'Account registered. Verify your phone number to activate the account.',
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterLandlordView(generics.CreateAPIView):
    serializer_class = RegisterLandlordSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            phone_number=data['phone_number'],
            email=data.get('email') or None,
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            account_status=AccountStatus.PENDING,
        )
        RoleService.assign_role(user, Role.LANDLORD)
        LandlordProfile.objects.create(
            user=user,
            legal_name=data.get('legal_name') or data.get('first_name', ''),
            display_name=data.get('display_name', ''),
            alternate_phone=data.get('alternate_phone', ''),
            nid_number=data.get('nid_number', ''),
        )
        OTPService.send(user, PhoneOTP.Purpose.PHONE_VERIFICATION)

        return Response(
            {
                'user': UserSerializer(user).data,
                'message': 'Account registered. Verify your phone number to activate the account.',
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPhoneView(generics.CreateAPIView):
    serializer_class = PhoneVerifySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        code = serializer.validated_data['code']

        user = User.objects.filter(phone_number=phone).first()
        if not user:
            return Response(
                {'error': {'code': 'not_found', 'message': 'No account found for this phone number.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            OTPService.verify(user, code, PhoneOTP.Purpose.PHONE_VERIFICATION)
        except ValueError as exc:
            return Response(
                {'error': {'code': 'invalid_otp', 'message': str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_phone_verified = True
        if user.account_status == AccountStatus.PENDING:
            user.account_status = AccountStatus.ACTIVE
        user.save(update_fields=['is_phone_verified', 'account_status', 'updated_at'])

        return Response({'detail': 'Phone number verified.'}, status=status.HTTP_200_OK)


class ResendVerificationView(generics.CreateAPIView):
    serializer_class = ResendVerificationSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        user = User.objects.filter(phone_number=phone).first()
        if user:
            OTPService.send(user, PhoneOTP.Purpose.PHONE_VERIFICATION)
        # Always succeed to avoid enumerating registered phone numbers.
        return Response({'detail': 'If the phone number is registered, a new code has been sent.'})


class PasswordResetRequestView(generics.CreateAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        phone = normalize_bd_phone(serializer.validated_data.get('phone_number') or '')

        user = None
        if email:
            user = User.objects.filter(email=email).first()
        elif phone:
            user = User.objects.filter(phone_number=phone).first()

        if user:
            # In development the "email" is printed to the console. Wire an SMTP
            # /email provider in production. Never include the raw token in logs.
            token = PasswordResetTokenGenerator().make_token(user)
            uid = force_str(user.pk)
            print(f'[PASSWORD-RESET] uid={uid} token={token} for {user.email or user.phone_number}')

        return Response({'detail': 'If an account exists, password reset instructions have been sent.'})


class PasswordResetConfirmView(generics.CreateAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': {'code': 'invalid', 'message': 'Invalid reset link.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not PasswordResetTokenGenerator().check_token(user, serializer.validated_data['token']):
            return Response(
                {'error': {'code': 'invalid', 'message': 'Invalid or expired reset link.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password', 'updated_at'])
        return Response({'detail': 'Password has been reset.'}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if hasattr(user, 'landlord_profile'):
            return LandlordProfileSerializer
        if hasattr(user, 'tenant_profile'):
            return TenantProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        profile_serializer = self.get_serializer_class()
        try:
            profile = profile_serializer(
                user.landlord_profile if hasattr(user, 'landlord_profile') else user.tenant_profile
            ).data
        except (LandlordProfile.DoesNotExist, TenantProfile.DoesNotExist):
            profile = None
        return Response({'user': UserSerializer(user).data, 'profile': profile})

    def update(self, request, *args, **kwargs):
        user = request.user
        partial = kwargs.pop('partial', False)

        # Update user fields
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        user_serializer.is_valid(raise_exception=True)

        allowed_user_fields = {'first_name', 'last_name', 'email'}
        for field in allowed_user_fields:
            if field in user_serializer.validated_data:
                setattr(user, field, user_serializer.validated_data[field])
        user.save(update_fields=['first_name', 'last_name', 'email', 'updated_at'])

        # Update profile if applicable
        profile_data = {k: v for k, v in request.data.items() if k not in allowed_user_fields}
        profile_serializer = self.get_serializer_class()

        if hasattr(user, 'landlord_profile') and profile_data:
            serializer = LandlordProfileSerializer(user.landlord_profile, data=profile_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        elif hasattr(user, 'tenant_profile') and profile_data:
            serializer = TenantProfileSerializer(user.tenant_profile, data=profile_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Re-fetch to get updated data
        user.refresh_from_db()
        profile = None
        if hasattr(user, 'landlord_profile'):
            profile = LandlordProfileSerializer(user.landlord_profile).data
        elif hasattr(user, 'tenant_profile'):
            profile = TenantProfileSerializer(user.tenant_profile).data

        return Response({'user': UserSerializer(user).data, 'profile': profile})


class ChangePasswordView(APIView):
    """Allow authenticated users to change their own password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': {'code': 'missing_fields', 'message': 'Both old_password and new_password are required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {'error': {'code': 'invalid_password', 'message': 'Current password is incorrect.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {'error': {'code': 'invalid_password', 'message': ' '.join(exc.messages)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class AddressListView(generics.ListCreateAPIView):
    """List or create addresses for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import UserAddressSerializer
        return UserAddressSerializer

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an address belonging to the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import UserAddressSerializer
        return UserAddressSerializer

    def get_queryset(self):
        return self.request.user.addresses.all()
