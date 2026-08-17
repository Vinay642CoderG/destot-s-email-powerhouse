# Destot Email Powerhouse

A full-stack website for Destot's managed email infrastructure services. The frontend is a TanStack Start application, while the backend is an Express API that handles health checks and verified contact-form email delivery.

## Stack

- Node.js 20
- Yarn Classic 1.22.22
- React 19, TypeScript, TanStack Start, TanStack Router, and TanStack Query
- Tailwind CSS and shadcn/ui
- Express, MongoDB, Mongoose, and Zod
- Nodemailer for SMTP delivery
- Cloudflare Turnstile for contact-form bot protection

## Project structure

```text
.
├── frontend/   # TanStack Start website
├── backend/    # Express API
└── README.md
```

## Requirements

- Node.js `20.19.6`
- Yarn `1.22.22`
- MongoDB running locally or an accessible MongoDB connection string
- SMTP credentials for contact-form email delivery
- Cloudflare Turnstile site and secret keys when bot protection is enabled

## Installation

Install each application separately:

```sh
cd frontend
yarn install

cd ../backend
yarn install
```

## Environment configuration

Copy each example file before starting development:

```sh
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

### Frontend

```env
VITE_API_URL=http://localhost:5000
VITE_TURNSTILE_ENABLED=false
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

### Backend

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/app_db
CORS_ORIGINS=http://localhost:8080

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@example.com
CONTACT_EMAIL=contact@example.com

TURNSTILE_ENABLED=false
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
TURNSTILE_HOSTNAMES=localhost,127.0.0.1
```

Never commit `.env` files or expose SMTP and Turnstile secrets in frontend code.

## Turnstile setup

For local development without Turnstile, set both flags to `false`:

```env
# frontend/.env
VITE_TURNSTILE_ENABLED=false

# backend/.env
TURNSTILE_ENABLED=false
```

To test the complete verification flow, enable both applications and use a matching site key and secret:

```env
# frontend/.env
VITE_TURNSTILE_ENABLED=true
VITE_TURNSTILE_SITE_KEY=your-site-key

# backend/.env
TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=your-secret-key
TURNSTILE_HOSTNAMES=localhost,127.0.0.1
```

The contact widget uses the Turnstile action `contact`. The backend requires successful Siteverify validation with that action and an approved hostname before sending email.

For production, set `NODE_ENV=production`, enable Turnstile, and configure only production frontend hostnames. Do not include `localhost` or `127.0.0.1` in the production hostname allowlist.

## Development

Start MongoDB, then run the backend:

```sh
cd backend
yarn dev
```

In another terminal, run the frontend:

```sh
cd frontend
yarn dev
```

The default local URLs are:

- Frontend: use the URL printed by Vite
- Backend: `http://localhost:5000`

If MongoDB is unavailable, Express still starts and `/ready` returns HTTP `503`.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Confirms the API is running |
| `GET` | `/api/v1` | Confirms API v1 is running |
| `GET` | `/health` | Process health check |
| `GET` | `/ready` | MongoDB readiness check |
| `POST` | `/api/v1/contact` | Verifies Turnstile and emails a contact submission |

### Contact request

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Example Ltd",
  "phone": "+91 00000 00000",
  "service": "Transactional Email",
  "volume": "10k–100k / month",
  "message": "We would like to discuss our email infrastructure.",
  "turnstileToken": "token-from-the-turnstile-widget"
}
```

When Turnstile is disabled in development, `turnstileToken` may be omitted. Production configuration does not allow Turnstile to be disabled.

## Verification commands

Backend:

```sh
cd backend
yarn typecheck
yarn build
```

Frontend:

```sh
cd frontend
yarn tsc --noEmit
yarn build
```

The frontend repository-wide lint command currently reports existing line-ending/Prettier issues on Windows. Run `yarn format` only when intentionally formatting the frontend codebase.

## Production checklist

- Set the public backend URL in `VITE_API_URL` before building the frontend.
- Store SMTP and Turnstile secrets in the deployment platform's secret manager.
- Set `NODE_ENV=production` on the backend.
- Set the correct production `CORS_ORIGINS`.
- Set `TURNSTILE_HOSTNAMES` to the production frontend hostname only.
- Build both applications and test a real contact submission.
- Confirm a Turnstile token succeeds once and is rejected when replayed.
