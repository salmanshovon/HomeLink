"""Middleware capturing request context for the audit log."""

import threading

_thread_locals = threading.local()


def get_current_request():
    return getattr(_thread_locals, 'request', None)


def get_current_user():
    request = get_current_request()
    return getattr(request, 'user', None) if request else None


class AuditLogMiddleware:
    """Stores the current request in thread-local storage for auditing."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            _thread_locals.request = None
        return response
