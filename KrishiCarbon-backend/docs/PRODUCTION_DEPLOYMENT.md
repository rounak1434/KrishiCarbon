# KrishiCarbon — Production Deployment Guide

This document details the complete step-by-step production deployment procedure for KrishiCarbon on **Vercel** (Frontend SPA), **Render** (Backend Web Service), **Supabase** (Managed PostgreSQL), and **Cloudinary** (Secure Document Storage).

---

## 1. Target Production Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    KrishiCarbon Frontend                    │
│             (Vercel: Vite / HTML5 / CSS3 / Vanilla JS)      │
│               https://krishicarbon.vercel.app               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON & Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    KrishiCarbon Backend                     │
│               (Render Web Service: Node / Express)          │
│            https://krishicarbon-backend.onrender.com        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Supabase PostgreSQL     │ │         Cloudinary         │
│     (Hosted Relational DB)   │ │  (Encrypted Cloud Storage) │
│  - Prisma ORM Migration Pool │ │  - Evidence Documents      │
│  - Farmers, Farms, Crops     │ │  - PDFs, Soil Cards, JPEGs │
│  - Deterministic Assessments │ │  - 10MB upload limit       │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Infrastructure Setup & Provisioning

### Step 1: Supabase PostgreSQL Setup
1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Note your database password when prompted.
3. In **Project Settings** ➔ **Database** ➔ **Connection string**:
   - Select **URI** mode and copy the connection string.
   - For serverless/pooled connections (recommended for Render), use the **Session Pooler** or **Transaction Pooler** URL (port `6543` or `5432`):
     ```text
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
   - For running migrations (`prisma migrate deploy`), you can use either the direct connection or transaction pooler.
4. Apply the database schema from local terminal (or via Render build):
   ```bash
   DATABASE_URL="<your-supabase-connection-string>" npx prisma migrate deploy
   ```

### Step 2: Cloudinary Document Storage Setup
1. Create an account at [cloudinary.com](https://cloudinary.com).
2. In the Cloudinary Dashboard, copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)
3. Target folder name: `krishicarbon_documents`.

### Step 3: Render Backend Web Service Setup
1. Log in to [render.com](https://render.com) and click **New +** ➔ **Web Service**.
2. Connect your Git repository (`https://github.com/rounak1434/KrishiCarbon.git`).
3. Set the following configuration:
   - **Name**: `krishicarbon-backend`
   - **Root Directory**: `KrishiCarbon-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. In **Environment Variables**, add:
   | Key | Value / Description |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Your Supabase pooled connection string |
   | `JWT_SECRET` | 32+ character random string (Render can generate this) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | `https://krishicarbon.vercel.app` (or Vercel preview URLs) |
   | `STORAGE_PROVIDER` | `cloudinary` |
   | `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name |
   | `CLOUDINARY_API_KEY` | Cloudinary API Key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
   | `CLOUDINARY_FOLDER` | `krishicarbon_documents` |
   | `AI_API_KEY` | *(Optional)* Gemini / OpenAI API key |

### Step 4: Vercel Frontend Deployment Setup
1. Log in to [vercel.com](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Import repository `rounak1434/KrishiCarbon`.
3. In Project Configuration:
   - **Root Directory**: Click "Edit" and choose `KrishiCarbon-frontend`.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://krishicarbon-backend.onrender.com/api` |
5. Click **Deploy**.

### Step 5: Render Static Site Alternative
If hosting the frontend on Render instead of Vercel:
1. In Render, click **New +** ➔ **Static Site**.
2. Set **Root Directory**: `KrishiCarbon-frontend`.
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. Rewrite: `/*` ➔ `/index.html`
6. Env: `VITE_API_BASE_URL=https://krishicarbon-backend.onrender.com/api`

---

## 3. Alternative: Deploy via Render Blueprint (`render.yaml`)

The repository includes a ready-to-deploy [`render.yaml`](file:///c:/Rounak/KrishiCarbon/render.yaml) specification.
1. In Render, select **New +** ➔ **Blueprint**.
2. Connect repository: `https://github.com/rounak1434/KrishiCarbon.git`.
3. Render reads `render.yaml` and provisions both services automatically.
4. Fill in the prompted secrets (`DATABASE_URL`, Cloudinary credentials, and `VITE_API_BASE_URL`).

---

## 4. Database Migrations in Production

- **Rule**: Never run `npx prisma migrate dev` in production.
- **Production Migration Command**:
  ```bash
  npx prisma migrate deploy
  ```
  This applies pending migrations in `prisma/migrations` directly to the live Supabase schema without generating new migration files or resetting data.
- **Client Generation**:
  ```bash
  npx prisma generate
  ```
- **Data Policy**:
  Production databases must **never** run automated seeds (`prisma db seed`). Production starts with an empty database, ensuring all metrics and records reflect real farmers.

---

## 5. Security & Auditing

- **HTTP Security Headers**: Express app utilizes `helmet()` with strict production defaults.
- **Server Binding**: Backend explicitly binds to `0.0.0.0` and utilizes `process.env.PORT`.
- **CORS Protection**: Origin validation matches configured `CORS_ORIGIN` domains.
- **Rate Limiting**: `express-rate-limit` prevents brute force and DDoS on all `/api/*` endpoints.
- **Secrets Protection**:
  - No secrets in Git (`.env` is strictly ignored in all modules).
  - Error middleware sanitizes all 500 error responses and never exposes stack traces or connection strings.
  - Document storage abstraction handles secure file uploads and removes temporary local files immediately.

---

## 6. Production Health Checks & Monitoring

- **Application Health**: `GET /health` (Unauthenticated)
  ```json
  {
    "status": "ok",
    "service": "krishicarbon-backend",
    "timestamp": "2026-10-06T00:30:00.000Z"
  }
  ```
- **Database Readiness**: `GET /ready` (Unauthenticated)
  ```json
  {
    "status": "ready",
    "database": "connected",
    "timestamp": "2026-10-06T00:30:00.000Z"
  }
  ```

---

## 7. Automated Production Smoke Test

Run the non-destructive smoke test against the deployed API:
```bash
PRODUCTION_API_URL=https://krishicarbon-backend.onrender.com/api node scripts/production-smoke-test.mjs
```

The smoke test validates all 13 core capabilities:
1. `GET /health` responds 200 OK
2. `GET /ready` confirms Supabase PostgreSQL connection
3. Dynamic farmer registration
4. JWT login & profile retrieval
5. Organic farm parcel creation
6. Multi-season crop history entry
7. Server-side deterministic readiness assessment
8. Cloudinary document upload
9. Farm practice update
10. Assessment recalculation & versioning
11. Assessment history timeline integrity
12. Session persistence verification
13. Safe test artifact cleanup

---

## 8. Rollback & Redeployment

- In Render Dashboard: Select **Deploys** ➔ Click on previous successful deploy ➔ **Rollback to this deploy**.
- To force redeployment: In Render Dashboard, click **Manual Deploy** ➔ **Clear build cache & deploy**.
- For schema rollback: Revert schema change, generate a rollback migration locally, test against test database, and deploy via `npx prisma migrate deploy`.

---

## 9. Known Limitations

- **Free Tier Sleep**: On Render Free tier, web services spin down after 15 minutes of inactivity. Initial request may take 30–50 seconds to cold start.
- **Supabase Pooler Limits**: Use `pgbouncer=true&connection_limit=1` on high concurrency to avoid exhaustion of connection limits on Supabase free tier.
