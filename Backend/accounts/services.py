"""Account services: role assignment and OTP delivery."""

import logging

from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from common.utils import generate_otp
from common import utils

from .models import Role, UserRole

logger = logging.getLogger(__name__)

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


class RoleService:
    """Server-side role assignment. Public users cannot self-assign roles."""

    PUBLIC_ROLES = {Role.TENANT, Role.LANDLORD}
    PRIVILEGED_ROLES = {Role.EMPLOYEE, Role.SUPERADMIN}

    @classmethod
    def assign_role(cls, user, role, assigned_by=None):
        if role in cls.PRIVILEGED_ROLES:
            if assigned_by is None or not cls._is_staff(assigned_by):
                raise PermissionError('Privileged roles can only be granted by staff.')
            if role == Role.SUPERADMIN and not assigned_by.is_superuser:
                raise PermissionError('Only a superuser can grant the superadmin role.')
        obj, created = UserRole.objects.get_or_create(
            user=user, role=role, defaults={'assigned_by': assigned_by}
        )
        return obj, created

    @staticmethod
    def _is_staff(user):
        return bool(user.is_staff or user.is_superuser or user.roles.filter(role=Role.EMPLOYEE).exists())


class OTPService:
    """Create and deliver one-time passwords through a provider abstraction."""

    @classmethod
    def send(cls, user, purpose):
        code = generate_otp()
        otp = user.otps.create(
            code=code,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
        )
        cls._deliver(user, code, purpose)
        return otp

    @classmethod
    def _deliver(cls, user, code, purpose):
        provider = getattr(settings, 'OTP_PROVIDER', 'console')
        message = f'Your HomeLink verification code is {code}. It expires in {OTP_TTL_MINUTES} minutes.'
        if provider == 'console':
            # Development only — never log OTPs in production.
            logger.info('[OTP:%s] %s -> %s', purpose, user.phone_number, message)
        else:
            # Production: dispatch to an SMS gateway. The gateway is not
            # implemented yet; raise so misconfiguration fails loudly.
            raise NotImplementedError(f'OTP provider "{provider}" is not configured.')

    @classmethod
    def verify(cls, user, code, purpose):
        """Consume an OTP. Returns the OTP instance or raises ValueError."""
        otp = (
            user.otps.filter(purpose=purpose, consumed_at__isnull=True)
            .order_by('-created_at')
            .first()
        )
        if otp is None or otp.is_expired:
            raise ValueError('No valid verification code found.')
        if otp.attempts >= OTP_MAX_ATTEMPTS:
            raise ValueError('Too many attempts. Request a new code.')
        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=['attempts', 'updated_at'])
            raise ValueError('Incorrect verification code.')
        otp.consumed_at = timezone.now()
        otp.save(update_fields=['consumed_at', 'updated_at'])
        return otp


# Re-export for convenience.
normalize_phone = utils.normalize_bd_phone
