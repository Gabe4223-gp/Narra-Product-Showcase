# Narra

A property management platform for Philippine landlords and their tenants: properties and units, tenancies and leases, billing and payments, maintenance issues, and a work portal for finding nearby contractors.

**Live demo:** https://narra-product-showcase.vercel.app

> The demo runs entirely on free hosting, which suspends idle services. **The first request after a quiet spell takes 30–60 seconds** while the API and database wake up. The app shows a "Waking up the server" screen while that happens; subsequent pages load normally.

---

## What it does

Narra has two sides, decided at sign-in by role.

**Manager (landlord)**

- **Properties and units** — portfolios, unit records, occupancy
- **Tenants** — tenancy records, government ID and lease documents, XLSX import
- **Billing** — generate itemised bill PDFs, track paid and unpaid, record proof of payment
- **Maintenance** — issues raised per unit, with document attachments and resolutions
- **Work Portal** — a Google Maps view of properties with nearby contractors, ratings and reviews, and appointment booking
- **Teams** — invite members and grant per-module permissions
- **Accounting** — Profit & Loss statement with CSV export *(illustrative figures; see Scope)*

**Tenant**

- Dashboard of bills, leases and payment history
- Pay a bill by card (Stripe) or GCash (PayMongo)
- View and manage lease documents, and request to end a lease
- Manage saved payment methods

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, React Router 7, Create React App |
| Backend | Node, Express 4, Sequelize 6 |
| Database | PostgreSQL 17 |
| Auth | Auth0 (RS256, JWKS validation) |
| Payments | Stripe, PayMongo (GCash) |
| Maps | Google Maps JavaScript API |
| Hosting | Vercel (web), Render (API), Neon (Postgres) |

Roughly 143 API routes, 67 React components, 14 tables and 28 migrations.

---

## Architecture

```
React (Vercel)
   |  Auth0 access token
   v
Express API (Render)  --->  PostgreSQL (Neon)
   |
   +-- Stripe        card payments
   +-- PayMongo      GCash payments
   +-- Google Maps   geocoding and contractor proximity
```

Auth0 issues an RS256 access token; the API validates it against the tenant's JWKS endpoint. Authentication is entirely Auth0's: the app never checks a password itself, and password changes and account deletion are carried out against Auth0 through its Management API. Deleting an account removes the Auth0 login along with every record the user owns, in a single transaction.

Generated documents (bill PDFs, leases, IDs) are written through a single storage module with three interchangeable backends — S3, a Postgres `bytea` table, or local disk — selected by `STORAGE_TYPE`. Postgres is used in the demo because free-tier hosts have ephemeral filesystems.

---

## Running locally

**Requirements:** Node 18+, PostgreSQL 14+, an Auth0 tenant.

```bash
git clone https://github.com/Gabe4223-gp/Narra-Product-Showcase.git
cd Narra-Product-Showcase/re_testproj

# frontend
npm install
cp .env.example .env          # then fill it in

# backend
cd backend
npm install
cp .env.example .env          # then fill it in
npx sequelize-cli db:migrate

# run both from re_testproj/
cd .. && npm start
```

Frontend on `http://localhost:3000`, API on `http://localhost:5000`.

Both `.env.example` files document every variable the app reads. The essentials:

**`re_testproj/.env`** — compiled into the browser bundle, so publishable keys only

```
REACT_APP_API_URL, REACT_APP_BASE_URL      the API origin
REACT_APP_AUTH0_DOMAIN, _CLIENT_ID, _AUDIENCE
REACT_APP_GOOGLE_MAPS_API_KEY
REACT_APP_STRIPE_PUBLISHABLE_KEY
```

**`re_testproj/backend/.env`** — secrets live here only

```
DATABASE_URL                 postgres connection string
AUTH0_DOMAIN, _ISSUER_BASE_URL, _AUDIENCE
AUTH0_CLIENT_ID, _CLIENT_SECRET   M2M app, for password change and account deletion
STRIPE_SECRET_KEY, PAYMONGO_SECRET_KEY
STORAGE_TYPE                 postgres | s3 | local
EMAIL_ENABLED                false unless SMTP is configured
```

`REACT_APP_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE` must match exactly, or every API call is rejected.

---

## Deployment

The demo is deployed as three free-tier services:

- **Vercel** builds `re_testproj`. `REACT_APP_*` values are compiled in at build time, so changing one requires a redeploy, not just a settings save. `vercel.json` supplies the SPA rewrite so deep links resolve.
- **Render** runs `re_testproj/backend`. Root directory must be set to that path. `PORT` is injected by Render and must not be set manually.
- **Neon** hosts Postgres. TLS is detected from the connection host, so no extra flag is needed.

Auth0 needs the deployed origin in **Allowed Callback URLs**, **Logout URLs** and **Web Origins**, and the same origin must appear in the API's CORS allowlist.

---

## Scope and limitations

This is a portfolio build. Being straightforward about where the edges are:

**Fully working** — properties, units, tenants, leases, billing and bill PDFs, maintenance issues, work portal, teams and permissions, notifications, settings, Auth0 sign-in, account deletion, GCash payments, card payments.

**Deliberately limited**

- **Accounting, Tax Filing, General Ledger** are scoped but not built. Each shows what it will do, and the sidebar marks them *Under Construction*. **Profit & Loss** has a complete UI and a working CSV export, but its figures are illustrative sample data, clearly labelled as such.
- **Wise transfers** are implemented but disabled (`WISE_ENABLED=false`). The integration targets a live money-movement API, which does not belong in a public demo.
- **Email** is behind `EMAIL_ENABLED`, off by default, so the bill-generation endpoint cannot be driven as an open relay.
- **Payments run in test mode.** Use Stripe's `4242 4242 4242 4242` with any future expiry and CVC.

**Known rough edges**

- `sequelize.sync()` still runs at startup alongside the migrations — two schema authorities where there should be one.
- Read endpoints are unauthenticated. Bulk deletes, mail-sending and payment intents require a valid token; single-record deletes do not.
- The frontend `package.json` carries several packages that shadow Node builtins (`fs`, `http`, `path`, …) inherited from the original project.
- Demo data is small and shared. Anyone signing in sees a clean account rather than the seeded portfolio.
- The sign-up form still writes a password column inherited from the original project. Nothing reads it — Auth0 authenticates every login — but it should be dropped.

---

## Repository layout

```
re_testproj/
├── src/                 React application
│   ├── Applications/    forms, documents, tenant applications
│   ├── Settings/        profile, business, team settings
│   ├── TenantView/      tenant dashboard, payments, leases
│   └── *.js             manager-side pages
├── backend/
│   ├── Server.js        Express app and the bulk of the routes
│   ├── storage.js       S3 / Postgres / local-disk file storage
│   ├── routes/          feature routers
│   ├── models/          Sequelize models
│   ├── migrations/      schema history
│   ├── services/        Auth0 admin, user purge
│   └── scripts/         maintenance scripts
├── public/
└── vercel.json          SPA rewrite
```
