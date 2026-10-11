# HomeLink Frontend

A production-quality React frontend for HomeLink, a Bangladesh-based property rental marketplace, rental brokerage, and property management platform.

## Tech Stack

- **React 19** with JavaScript (JSX)
- **Vite 8** — build tool and dev server
- **React Router 7** — client-side routing
- **TanStack Query 5** — server-state fetching and caching
- **React Hook Form 7** + **Zod** — form handling and validation
- **Axios** — HTTP client
- **Lucide React** — icon library
- **Vitest 5** + **React Testing Library** — testing
- **Custom CSS design system** — design tokens, no external UI framework

## Project Architecture

```
src/
  app/              # App entry, router, providers
  api/              # API client and endpoint modules
  assets/           # Static assets
  components/       # Reusable UI components
    common/         # Buttons, inputs, cards, badges, modals, etc.
    layout/         # Header, footer, sidebar, dashboard layout
    property/       # Property cards and related components
    feedback/       # Error boundary, spinners
  contexts/         # React Context (AuthContext)
  features/         # Feature-specific components
  hooks/            # Custom hooks (useLogout)
  layouts/          # Page layouts (Public, Auth, Tenant, Landlord, Employee, Admin)
  pages/            # Route-level page components
    public/         # Home, Search, PropertyDetails, HowItWorks, About, Contact, etc.
    auth/           # Login, Register, VerifyPhone, PasswordReset
    tenant/         # Tenant dashboard pages
    landlord/       # Landlord dashboard pages
    employee/       # Employee operations pages
    admin/          # Superadmin pages
    errors/         # NotFound, AccessDenied
    services/       # Maintenance service pages
  routes/           # ProtectedRoute, RoleRoute
  styles/           # Design tokens and global styles
  test/             # Test setup and test files
  utils/            # Utilities (currency, date, validation)
```

## Prerequisites

- Node.js 20+ and npm
- The HomeLink Django backend running (see `Backend/README.md`)

## Installation

```powershell
cd Frontend
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Base URL for the Django REST API.
# Leave empty in development to use the Vite proxy (requests go to /api/...).
VITE_API_BASE_URL=

# Public site URL
VITE_PUBLIC_SITE_URL=https://homelink.com.bd

# Enable React Query devtools in development
VITE_ENABLE_QUERY_DEVTOOLS=true
```

**Important:** Vite environment variables prefixed with `VITE_` are public in the built application. Never put secrets in them.

## Local Development

```powershell
npm run dev
```

The app runs at `http://localhost:5173/`. API requests to `/api/...` are proxied to the Django server at `http://127.0.0.1:8000`.

### Backend Setup

1. Navigate to `Backend/`
2. Create a virtual environment: `py -m venv .venv`
3. Activ it: `.\.venv\Scripts\Activate.ps1`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and configure
6. Run migrations: `python manage.py migrate`
7. (Optional) Seed data: `python manage.py seed_base_data`
8. Run the server: `python manage.py runserver`

The API is served at `http://127.0.0.1:8000/api/v1/`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |
| `npm run lint:fix` | Run Oxlint with auto-fix |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Authentication

- **Identifier:** Phone number (normalized to `+8801XXXXXXXXX`), plus password
- **Tokens:** JWT access (15 min) + refresh (7 days), via `djangorestframework-simplejwt`
- **Token storage:** Access token in memory, refresh token in localStorage (for session restoration)
- **Roles:** `TENANT`, `LANDLORD`, `EMPLOYEE`, `SUPERADMIN`
- Public registration creates `TENANT` or `LANDLORD` accounts only

### Auth Endpoints

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

## API Integration

The frontend integrates with the Django REST Framework backend through a centralized Axios client (`src/api/client.js`):

- Base URL from `VITE_API_BASE_URL` env var
- JWT Bearer token attachment via request interceptor
- Automatic token refresh on 401 responses (single-flight, no infinite loops)
- Standardized error envelope: `{ error: { code, message, details } }`
- Pagination: `{ count, next, previous, results }`
- All monetary values use BDT formatting via `Intl.NumberFormat`

### API Modules

| Module | Endpoints |
|--------|-----------|
| `auth.api.js` | Login, register, logout, verify, password reset, profile |
| `properties.api.js` | Public search, details, media, saved, inquiries, location access |
| `tenants.api.js` | Tenancies, requirements, viewings, invoices, complaints, messages, notifications |
| `landlords.api.js` | Properties, listings, tenancies, complaints, invoices, payments, announcements |
| `employees.api.js` | Property verification, listing moderation, viewings, applications, tenancies, leads, audit |
| `services.api.js` | Service categories, requests, quotes, appointments |

## Testing

```powershell
npm run test
```

Tests cover:
- App mounting and routing
- Component rendering (Button, Badge, Card, EmptyState, ErrorState)
- Validation schemas (login, registration)
- Search page filters and API query construction
- Currency and date formatting utilities
- ApiError handling

## Production Build

```powershell
npm run build
```

Output goes to `dist/`. The hosting environment must support SPA route fallback so direct navigation to routes like `/properties/...` and `/tenant/...` works.

### Deployment Requirements

- **HTTPS:** Required for production
- **CORS:** Configure `DJANGO_CORS_ALLOWED_ORIGINS` in the backend to include the frontend origin
- **Backend URL:** Set `VITE_API_BASE_URL` to the deployed API origin
- **SPA fallback:** Configure the web server to serve `index.html` for all non-API routes

## Known Backend Limitations

- No WebSocket support — messaging uses REST polling via TanStack Query
- No payment gateway integration — payment initiation creates a `pending` record; verification is staff-only
- No file upload endpoints for property media in the current API (media management is backend-only)
- Commission agreement creation is staff-only
- Employee and superadmin accounts are created server-side (no public registration)
- Audit log filtering is not exposed via query parameters (client-side only)

## Design System

The app uses a custom CSS design system defined in `src/styles/tokens.css`:

- **Brand colors:** Green palette (`--color-brand-*`)
- **Neutral colors:** Gray palette (`--color-neutral-*`)
- **Semantic colors:** Success, warning, danger, info
- **Typography:** Inter font family, modular scale
- **Spacing:** 4px base unit
- **Border radius:** sm, md, lg, xl, 2xl, full
- **Shadows:** sm, md, lg, xl
- **Z-index scale:** base, dropdown, sticky, overlay, modal, toast

All components use CSS custom properties for theming. No external CSS framework is used.

## Accessibility

- Skip-to-content link for keyboard navigation
- ARIA labels on interactive elements
- Focus-visible outlines
- Semantic HTML structure
- Reduced motion support via `prefers-reduced-motion`
- Form validation with accessible error messages
