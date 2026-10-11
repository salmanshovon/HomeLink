# HomeLink

Full-stack property rental brokerage and management platform (Bangladesh).

- **Backend:** Django 6.1 + Django REST Framework (this repository's `Backend/`)
- **Frontend:** React 19 + Vite (`Frontend/`)
- **API prefix:** `/api/v1/`
- **Docs:** `/api/docs/` (Swagger UI), `/api/redoc/`, `/api/schema/`

---

## Backend structure

```
Backend/
├── config/                 # project settings (split by environment), urls, wsgi/asgi
│   └── settings/
│       ├── base.py
│       ├── development.py  # SQLite, debug, console email/OTP
│       └── production.py   # PostgreSQL, secure headers, env secrets
├── common/                 # shared base models, permissions, pagination, exceptions,
│                           #   utils, validators, private media storage, seed command
├── accounts/               # custom user (phone auth), roles, profiles, addresses, OTP
├── properties/             # properties, units, amenities, listings, media, documents,
│                           #   contacts, visit logs, audits, saved, inquiries, location grants
├── search/                 # public listing search + location facets
├── leads/                  # rental requirements, service requests, matches, leads
├── rentals/                # viewings, applications, tenancies, members, events
├── billing/                # invoices, bills, payments, allocations, refunds, receipts
├── commissions/            # commission agreements, obligations, ledger
├── communications/         # conversations, messages, announcements
├── notifications/          # notifications + delivery attempts
├── services/               # paid services, maintenance requests, quotes, appointments
├── complaints/             # complaints, attachments, comments
├── audit/                  # immutable audit log
├── CONVENTIONS.md          # implementation conventions
├── requirements.txt
├── manage.py
└── .env / .env.example
```

## Prerequisites

- Python 3.13+ (use `py` on Windows)
- Node.js 20+ and npm (for the frontend)
- PostgreSQL 14+ for production (SQLite is used for local development)

## Setup

### 1. Create a virtual environment

```powershell
cd Backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Edit `.env` (see **Environment variables** below).

### 4. Create the database

- **Development:** SQLite is created automatically (`db.sqlite3`).
- **Production:** create the PostgreSQL database and user, then set `DB_*` in `.env`.

### 5. Run migrations

```powershell
python manage.py migrate
```

### 6. Create a superuser

```powershell
python manage.py createsuperuser
```

You will be prompted for a phone number (the login identifier) and password.

### 7. Load development seed data (optional, dev only)

```powershell
python manage.py seed_base_data
```

Seeds common amenities and the maintenance service categories. **Never run in production.**

### 8. Run the development server

```powershell
python manage.py runserver
```

The API is served at `http://127.0.0.1:8000/api/v1/`.

### 9. Run tests

```powershell
python manage.py test
```

### 10. API documentation

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`
- Raw schema: `http://127.0.0.1:8000/api/schema/`

## Environment variables

Defined in `Backend/.env` (see `.env.example`).

| Variable | Description | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key (required in production) | dev fallback |
| `DJANGO_DEBUG` | Debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Comma-separated React origins | `http://localhost:5173,...` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | PostgreSQL connection (production) | — |
| `DJANGO_USE_S3` | Use S3-compatible storage for media | `False` |
| `AWS_*` | S3 credentials/bucket (when `DJANGO_USE_S3=True`) | — |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP (production) | — |
| `OTP_PROVIDER` | `console` (dev) or an SMS gateway (prod) | `console` |

## Authentication

- **Identifier:** phone number (normalized to `+8801XXXXXXXXX`), plus password.
- **Tokens:** JWT access (15 min) + refresh (7 days), via `djangorestframework-simplejwt`.
- **Phone verification:** OTP (console in dev). Verified users get `account_status=active`.
- **Roles:** `LANDLORD`, `TENANT`, `EMPLOYEE`, `SUPERADMIN`. Public registration can only
  create `TENANT`/`LANDLORD`; privileged roles are granted server-side by staff.

### Auth endpoints

- `POST /api/v1/auth/register/tenant/`
- `POST /api/v1/auth/register/landlord/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/verify-phone/`
- `POST /api/v1/auth/resend-verification/`
- `POST /api/v1/auth/password-reset/`
- `POST /api/v1/auth/password-reset/confirm/`
- `GET/PATCH /api/v1/accounts/me/`

## Key endpoint groups

- **Public discovery:** `GET /api/v1/properties/`, `GET /api/v1/listings/`, `GET /api/v1/properties/amenities/`, `GET /api/v1/properties/locations/`
- **Landlord:** `/api/v1/landlord/properties/`, `/api/v1/landlord/listings/`, `/api/v1/landlord/tenancies/`, `/api/v1/landlord/announcements/`
- **Employee/staff:** `/api/v1/employee/properties/`, `/api/v1/employee/listings/`, `/api/v1/employee/location-grants/`
- **Rental assistance:** `/api/v1/rental-requirements/`, `/api/v1/rental-service-requests/`, `/api/v1/leads/`
- **Viewings & applications:** `/api/v1/viewings/`, `/api/v1/applications/`
- **Tenancies:** `/api/v1/tenancies/`
- **Billing:** `/api/v1/billing/invoices/`, `/api/v1/billing/bills/`, `/api/v1/billing/payments/`, `/api/v1/billing/receipts/`
- **Commissions:** `/api/v1/agreements/`, `/api/v1/obligations/`, `/api/v1/ledger/`
- **Communications:** `/api/v1/conversations/`, `/api/v1/announcements/`
- **Complaints:** `/api/v1/complaints/`
- **Notifications:** `/api/v1/notifications/`
- **Services:** `/api/v1/categories/`, `/api/v1/requests/`
- **Audit:** `/api/v1/audit-logs/`

## Frontend (React + Vite)

```powershell
cd Frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173/`. Requests to `/api/...` are proxied to the Django
server (see `Frontend/vite.config.js`). Set `VITE_API_BASE_URL` in `Frontend/.env` to point
at a deployed API.

## Notes

- All monetary values use `DecimalField` (BDT). Never floats.
- Private documents (ownership documents, agreements, identity files) are stored outside
  `MEDIA_ROOT` and served only through permission-checked endpoints.
- Public serializers never expose private addresses, caretaker contacts, NID numbers, or
  internal notes.
