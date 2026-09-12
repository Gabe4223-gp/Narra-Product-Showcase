# Narra — Property Management System

> **A project showcase for Narra Property Management**, a startup co-founded by **Gabe Payumo, Josh Chan, Marcuz Cosiquien and Ethan Cua** from **January 2025 to September 2025**, built under the **University of Toronto Hatchery NEST Program**.
>
> This repository is a working restoration of that product, redeployed on free infrastructure so the build can be explored end to end.

A property management platform for Philippine landlords and their tenants: properties and units, tenancies and leases, billing and payments, maintenance issues, and a work portal for finding nearby contractors.

**Live demo:** https://narra-product-showcase.vercel.app

> The demo runs entirely on free hosting, which suspends idle services. **The first request after a quiet spell takes 30–60 seconds** while the API and database wake up. The app shows a "Waking up the server" screen while that happens; subsequent pages load normally.

---

## Background

Narra was built to address a specific gap in the Philippine property market: mid-to-large developers managing hundreds of units on spreadsheets, disconnected messaging threads and manual bank reconciliation, with no single system tying tenancies, billing and maintenance together.

**Commercial traction**

- **Over $22,000 in committed annual recurring revenue** from enterprise clients
- **1,360 units under management** across those commitments
- Clients drawn from **mid-to-large property developers in the Philippines**, the segment least served by existing tools

**Hatchery NEST Program**

Narra advanced to the **incubator stage** of the University of Toronto Hatchery's NEST program — a cohort-based venture accelerator that takes teams from problem validation through customer discovery toward an investor-ready company.

**The product**

The team built a **proprietary property management system** from the ground up rather than assembling off-the-shelf tools, giving developers one place to track property-related data and process transactions: portfolios and unit inventory, tenancy records and lease documents, itemised billing with generated invoices, tenant-side online payment, maintenance issue tracking, and a contractor marketplace tied to property location.

---

## Screenshots

| | |
|---|---|
| ![Properties dashboard](docs/screenshots/properties.png) | ![Billing](docs/screenshots/billing.png) |
| **Properties** — portfolio overview across companies and locations | **Billing** — unfulfilled and fulfilled bills, by property and period |
| ![Tenant profile](docs/screenshots/tenant-profile.png) | ![Work portal](docs/screenshots/work-portal.png) |
| **Tenant profile** — details, billing activity, leases and actions | **Work Portal** — contractors mapped against property location |

---

## Features

### Manager view

| Area | What it does |
|---|---|
| **Properties** | Portfolios across multiple companies, with address, ownership and unit inventory |
| **Units** | Unit records with type, size, pets policy, occupancy and tenant assignment |
| **Tenants** | Tenancy records, contact and employment details, government ID and lease documents, bulk XLSX import |
| **Billing** | Itemised bills with generated PDF invoices, rent/utilities/other fees and tax, deadline tracking, paid and unpaid views, proof-of-payment capture, bulk mark paid or unpaid |
| **Leases** | Upload lease documents against a tenancy, track signature status and expiry, receive end-of-lease requests |
| **Maintenance** | Issues raised per unit with type, description and document attachments; resolutions recorded against each |
| **Work Portal** | Google Maps view of a property with nearby maintenance workers, filters for rating, rate and availability, star ratings and written reviews, appointment booking |
| **Teams** | Invite members and grant per-module permissions, so a bookkeeper sees billing and a superintendent sees maintenance |
| **Settings** | Personal, business and bank details; password change and account deletion handled through Auth0 |

### Tenant view

| Area | What it does |
|---|---|
| **Dashboard** | Current lease, outstanding bills and payment history in one place |
| **Payments** | Pay a bill by card (Stripe) or GCash (PayMongo), with status reflected back on the bill |
| **Payment methods** | Save and manage bank, card and GCash details |
| **Leases** | View the current lease document, see whether it awaits signature, request to end a tenancy |
| **Billing history** | Past bills with invoices and payment dates |

### Coming soon

Four modules are scoped and reachable in the app, marked *Under Construction* in the sidebar:

| Module | Planned |
|---|---|
| **Accounting** | Automatic reconciliation of issued bills against recorded payments, expense categorisation, chart of accounts per property and company, period locking, CSV export |
| **Profit & Loss** | Monthly income and expense statement with cumulative totals and CSV export. **The interface and export are complete and working**; the figures are illustrative sample data, clearly labelled in the app |
| **Tax Filing** | VAT and expanded withholding tax computed from issued bills, quarterly and annual summaries aligned to BIR periods, BIR 2307 certificates per tenant, filing calendar |
| **General Ledger** | Journal entries derived from bills and payments, with the filter and export interface already in place |

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

## Installation and setup

**Requirements**

| | Version |
|---|---|
| Node.js | 18 or newer |
| npm | 9 or newer |
| PostgreSQL | 14 or newer (17 recommended) |
| Auth0 | a tenant with a SPA application and an API |

**1. Clone and install**

```bash
git clone https://github.com/Gabe4223-gp/Narra-Product-Showcase.git
cd Narra-Product-Showcase/re_testproj

npm install
cd backend && npm install && cd ..
```

**2. Create the database**

```bash
createdb narra_database
```

**3. Configure the environment**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

`re_testproj/.env` is compiled into the browser bundle, so it takes **publishable keys only**:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BASE_URL=http://localhost:5000
REACT_APP_AUTH0_DOMAIN=your-tenant.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=...
REACT_APP_AUTH0_AUDIENCE=https://your-api-identifier
REACT_APP_GOOGLE_MAPS_API_KEY=...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

`re_testproj/backend/.env` holds the secrets:

```
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/narra_database
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_CLIENT_ID=...            # M2M app, for password change and account deletion
AUTH0_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
PAYMONGO_SECRET_KEY=sk_test_...
STORAGE_TYPE=local             # local | postgres | s3
EMAIL_ENABLED=false
```

> `REACT_APP_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE` must match **exactly**, or every API call is rejected.

**4. Run the migrations**

```bash
cd backend
npx sequelize-cli db:migrate
cd ..
```

**5. Start both services**

```bash
npm start
```

Frontend on `http://localhost:3000`, API on `http://localhost:5000`.

**6. Point Auth0 at the local app**

In the Auth0 dashboard, add `http://localhost:3000` to the SPA application's **Allowed Callback URLs**, **Allowed Logout URLs** and **Allowed Web Origins**.

---

## Usage examples

**Check the API and its database connection**

```bash
curl http://localhost:5000/           # -> Backend is running successfully!
curl http://localhost:5000/db-test    # -> Database connection successful!
```

**Fetch a landlord's properties**

```bash
curl "http://localhost:5000/properties?user_id=<userProfileId>"
```

**Call a protected endpoint**

Endpoints that send mail, delete in bulk or move money require an Auth0 access token:

```bash
curl -X DELETE http://localhost:5000/tenants/delete-all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantIds":["..."],"propertyId":"..."}'
```

Without the token the API returns `401 {"error":"Sign in to perform this action."}`.

**Pay a bill with a test card**

Sign in as a tenant, open an unpaid bill, choose **Credit/Debit**, and use Stripe's test card:

```
4242 4242 4242 4242   any future expiry   any CVC
```

**Remove a user and everything they own**

```bash
cd backend
node scripts/purgeUser.js someone@example.com            # dry run, shows what would go
node scripts/purgeUser.js someone@example.com --confirm  # deletes, in one transaction
```

---

## Deployment

The demo runs as three free-tier services:

- **Vercel** builds `re_testproj`. `REACT_APP_*` values are compiled in at build time, so changing one requires a redeploy, not just a settings save. `vercel.json` supplies the SPA rewrite so deep links resolve.
- **Render** runs `re_testproj/backend`. Root directory must be set to that path. `PORT` is injected by Render and must not be set manually.
- **Neon** hosts Postgres. TLS is detected from the connection host, so no extra flag is needed.

Auth0 needs the deployed origin in **Allowed Callback URLs**, **Logout URLs** and **Web Origins**, and the same origin must appear in the API's CORS allowlist.

---

## Scope and limitations

This is a portfolio build. Being straightforward about where the edges are:

**Fully working** — properties, units, tenants, leases, billing and bill PDFs, maintenance issues, work portal, teams and permissions, notifications, settings, Auth0 sign-in, account deletion, GCash payments, card payments.

**Deliberately limited**

- The four accounting modules above are scoped rather than built, and say so in the app.
- **Wise transfers** are implemented but disabled (`WISE_ENABLED=false`). The integration targets a live money-movement API, which does not belong in a public demo.
- **Email** is behind `EMAIL_ENABLED`, off by default, so the bill-generation endpoint cannot be driven as an open relay.
- **Payments run in test mode.**

**Known rough edges**

- `sequelize.sync()` still runs at startup alongside the migrations — two schema authorities where there should be one.
- Read endpoints are unauthenticated. Bulk deletes, mail-sending and payment intents require a valid token; single-record deletes do not.
- The frontend `package.json` carries several packages that shadow Node builtins (`fs`, `http`, `path`, …) inherited from the original project.
- The sign-up form still writes a password column inherited from the original project. Nothing reads it — Auth0 authenticates every login — but it should be dropped.
- Demo data is small and shared. Anyone signing in sees a clean account rather than the seeded portfolio.

---

## Repository layout

```
.
├── README.md
├── LICENSE
├── docs/screenshots/    images used in this README
└── re_testproj/
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

---

## Contributing

This repository showcases a specific product rather than an actively developed library, so it is not seeking feature contributions. Corrections and questions are welcome.

**Reporting an issue** — open a GitHub issue describing what you did, what you expected, and what happened. For anything visual, a screenshot and the browser console output help considerably.

**Opening a pull request**

1. Fork the repository and branch from `main`
2. Keep the change focused and match the surrounding style — this codebase has grown over time, and consistency within a file matters more than global uniformity
3. Run `npm run build` in `re_testproj` before pushing; the build must exit cleanly
4. Describe what changed and why, and note anything you could not verify

**Security** — please do not open a public issue for a suspected vulnerability. Contact the repository owner directly.

---

## License

Copyright © 2025 Narra Property Management. All rights reserved. See [LICENSE](LICENSE).

The source is published for demonstration and portfolio review. It is not licensed for reuse, modification or redistribution without written permission from the copyright holders.
