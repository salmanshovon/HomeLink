"""Development settings (SQLite, debug tooling, console email)."""

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, env_bool, env_list

DEBUG = env_bool('DJANGO_DEBUG', True)
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Django Debug Toolbar is optional; enable by adding to LOCAL_APPS if installed.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# OTP provider: console in development (prints the code instead of sending SMS).
OTP_PROVIDER = 'console'

CORS_ALLOWED_ORIGINS = env_list(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000',
)

# Relaxed rate limits in development.
DJANGO_RATELIMIT_ENABLED = False

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
}
