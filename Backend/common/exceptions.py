"""Standardized DRF exception handling.

Returns a consistent error envelope:

    {"error": {"code": "...", "message": "...", "details": {...}}}
"""

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def standardized_exception_handler(exc, context):
    """Wrap DRF's default handler to produce a stable error envelope."""
    response = exception_handler(exc, context)

    if response is not None:
        response.data = _envelope_dict(response.status_code, response.data)
        return response

    # Handle Django's own 403/404 so the envelope stays consistent.
    if isinstance(exc, Http404):
        return _response(status.HTTP_404_NOT_FOUND, 'not_found', 'Not found.')
    if isinstance(exc, DjangoPermissionDenied):
        return _response(status.HTTP_403_FORBIDDEN, 'permission_denied', 'Permission denied.')
    return None


def _envelope_dict(status_code, data):
    """Build the error envelope dict (NOT a Response)."""
    if isinstance(data, dict) and 'detail' in data:
        message = data['detail']
        details = {k: v for k, v in data.items() if k != 'detail'}
    elif isinstance(data, dict):
        message = data.get('detail') or data.get('message') or 'Request failed.'
        details = {k: v for k, v in data.items() if k not in ('detail', 'message')}
    elif isinstance(data, list):
        message = 'Request failed.'
        details = {'errors': data}
    else:
        message = str(data)
        details = {}

    code = data.get('code') if isinstance(data, dict) else None
    envelope = {'error': {'code': code or 'error', 'message': message}}
    if details:
        envelope['error']['details'] = details
    return envelope


def _response(status_code, code, message, details=None):
    body = {'error': {'code': code, 'message': message}}
    if details:
        body['error']['details'] = details
    return Response(body, status=status_code)
