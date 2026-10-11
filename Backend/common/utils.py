"""Utility helpers: phone normalization, references, money, etc."""

import re
import secrets
import string
from decimal import Decimal

# Bangladesh mobile: +8801XXXXXXXXX (11-digit national number starting 01).
_BD_PHONE_RE = re.compile(r'^\+8801[3-9]\d{8}$')
_NATIONAL_RE = re.compile(r'^01[3-9]\d{8}$')


def normalize_bd_phone(value):
    """
    Normalize a Bangladeshi phone number to ``+8801XXXXXXXXX``.

    Accepts ``01XXXXXXXXX``, ``8801XXXXXXXXX``, ``+8801XXXXXXXXX`` and common
    formatting (spaces/dashes). Returns ``None`` when the input cannot be
    normalized to a valid BD mobile number.
    """
    if not value:
        return None
    cleaned = re.sub(r'[\s\-().]', '', str(value))
    if cleaned.startswith('00880'):
        cleaned = '+' + cleaned[2:]
    elif cleaned.startswith('880'):
        cleaned = '+' + cleaned
    elif cleaned.startswith('01'):
        cleaned = '+880' + cleaned[1:]
    return cleaned if _BD_PHONE_RE.match(cleaned) else None


def is_valid_bd_phone(value):
    return bool(normalize_bd_phone(value))


def generate_reference(prefix='', length=10):
    """Generate an uppercase alphanumeric reference (e.g. ``PROP-A1B2C3``)."""
    alphabet = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f'{prefix}-{suffix}' if prefix else suffix


def generate_otp(length=6):
    """Cryptographically secure numeric OTP."""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def quantize(value, places=2):
    """Quantize a decimal to the given number of places (default 2 for BDT)."""
    return Decimal(value).quantize(Decimal(1).scaleb(-places))


def in_units(amount):
    """Helper returning a Decimal for money inputs."""
    return Decimal(amount)
