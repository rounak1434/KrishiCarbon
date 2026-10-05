# AgriCred Backend - Farmer Carbon Credit Readiness Assessment Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-5.x-yellow.svg)](https://vitest.dev/)

AgriCred is an assessment platform engineered for hackathon evaluation and production readiness. It quantitatively evaluates a farm's readiness to participate in carbon-credit verification programs based on soil management practices, conservation tillage, residue retention, irrigation methods, crop history, and documentary evidence.

> [!IMPORTANT]
> **Prototype Assessment Model Notice**:
> AgriCred calculates an internal readiness score (*High Readiness*, *Moderate Readiness*, *Needs Improvement*) based on configured agronomic parameters and verifiable documentary evidence. This platform estimates preparedness and does **not** falsely claim to be an official carbon-credit certification or guaranteed credit issuance.

---

## 🌟 Key Features

1. **Deterministic Scoring Engine (`v1.0.0`)**:
   - Transparent, weighted algorithmic model across 6 key agronomic dimensions:
     - **Farming Practices (25%)**: Evaluates zero-tillage, residue mulching/biochar, biofertilizers vs synthetic chemicals, and IPM. Stubble burning incurs an immediate penalty.
     - **Soil Management (20%)**: Evaluates soil texture carbon stabilization capacity, tillage reduction, and presence of certified laboratory soil test reports.
     - **Irrigation (15%)**: Evaluates drip/micro-irrigation and rainwater harvesting vs flood irrigation.
     - **Crop History (15%)**: Evaluates multi-season diversity, yield stability, and nitrogen-fixing legume inclusion.
     - **Documentation (15%)**: Audits presence of verified Land Deeds, Soil Health Cards, Crop Sales Receipts, Irrigation Logs, and Input Purchase Vouchers.
     - **Evidence Quality (10%)**: Verification ratio and geotagged practice photos.
   - 100% deterministic: The same farm inputs always produce the exact same score.

2. **Dynamic Recommendation Engine**:
   - Analyzes category weaknesses and generates prioritized action items (`HIGH`, `MEDIUM`, `LOW`).
   - Actionable recommendations (e.g. transitioning from flood to drip irrigation, ceasing stubble burning, obtaining soil carbon tests, intercropping legumes).
   - Interactive completion tracking for farmers.

3. **Evidence & Document Management**:
   - Multi-format file upload (PDF, JPEG, PNG) with strict 10MB limits, MIME checking, and safe filenames.
   - Storage service abstraction (`IDocumentStorageService`) supporting local disk with seamless future migration to S3/Cloudinary/Supabase.
   - Isolated `DocumentExtractionService` with graceful fallback when AI keys are unconfigured (heurisitic template + `REVIEW_REQUIRED` status).

4. **Iterative Reassessment**:
   - Supports `POST /api/assessments/:id/recalculate`.
   - Creates a **new** assessment entry rather than mutating historical records, allowing progress tracking over time (e.g., 23 → 55 → 74 → 88).

5. **Role-Based Access Control (RBAC)**:
   - Secured with bcrypt password hashing and JWT authentication.
   - Strict farm ownership isolation for `FARMER` role.
   - Comprehensive administrative analytics and metrics for `ADMIN` role.

6. **Interactive OpenAPI / Swagger Documentation**:
   - Full Swagger UI available at `/api/docs`.

---

## 🏗️ Architecture

AgriCred strictly adheres to modular layered architecture:

```
src/
├── config/                  # Environment validation (Zod), Prisma client, Swagger spec
├── middleware/              # JWT auth, RBAC, Multer upload, Rate limiters, Error handling
├── modules/
│   ├── auth/                # Register, Login, GetMe (bcrypt + JWT + Audit)
│   ├── farmers/             # Farmer profile management
│   ├── farms/               # Farm CRUD + sustainable practices
│   ├── crops/               # Seasonal crop history CRUD
│   ├── documents/           # Upload, Storage abstraction, evidence audit
│   ├── assessments/         # Assessment creation, retrieval, recalculation
│   └── admin/               # Administrative dashboard, aggregates, statistics
├── engine/
│   ├── scoring/             # Deterministic assessment calculation engine & config
│   ├── evidence/            # Evidence auditing & AI/heuristic extraction
│   └── recommendations/     # Prioritized recommendation generation
├── utils/                   # Structured logger, custom errors, unified API responses, audit logs
├── app.ts                   # Express application setup
└── server.ts                # HTTP server startup & graceful shutdown
```

---

## 🗄️ Database Schema

Implemented in PostgreSQL via Prisma ORM:

| Model | Purpose |
|---|---|
| `User` | Authentication credentials, role (`FARMER`, `ADMIN`), timestamps |
| `Farmer` | Demographic profile (name, phone, state, district) tied to User |
| `Farm` | Farm details (acreage, soil type, tillage, residue, irrigation, fertilizers, organic flag) |
| `CropHistory` | Multi-season crop records (crop name, season, year, yield) |
| `Document` | File metadata, storage URL, status (`UPLOADED`, `VERIFIED`, `REVIEW_REQUIRED`, `REJECTED`), extracted data |
| `Assessment` | Assessment record (overall score, readiness level, engine version `1.0.0`, strengths, gaps, factors) |
| `AssessmentCategoryScore` | Category scores and weights (farming practices, soil, irrigation, crops, docs, quality) |
| `Recommendation` | Dynamic prioritized recommendations (`HIGH`, `MEDIUM`, `LOW`), completion toggle |
| `AuditLog` | Immutable audit trail for auth, farm changes, document uploads, and assessments |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database running locally or via cloud (e.g., Supabase, Neon)

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure variables are set:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agricred?schema=public"
JWT_SECRET="agricred_hackathon_super_secret_jwt_key_2026_production_ready"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
AI_API_KEY=""
STORAGE_PROVIDER="local"
STORAGE_PATH="./uploads"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration and Seeding

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply Database Migrations
# Apply Database Migrations (development)
npm run prisma:migrate

# Apply Database Migrations (production)
npm run prisma:migrate:deploy

# (Optional) Seed Demo Fixtures (Development/Testing only - not required in production)
npm run db:seed
```

### 4. Running the Application

```bash
# Development mode (with live watch)
npm run dev

# Production build and run
npm run build
npm start
```

---

## 🧪 Testing

The comprehensive automated test suite covers scoring determinism, empty database operations, data-driven integrity audits, classification thresholds, dynamic recommendation generation, Zod schemas, evidence quality auditing, live demo progression flow, and network HTTP integration.

Run tests:
```bash
npm test
```

Test Results:
- **11 Test Files, 69 Tests: 100% Passed**
  - `empty.database.test.ts`: Proves application works properly with zero records in database (empty states).
  - `data.driven.audit.test.ts`: Proves data modifications genuinely alter calculated scores and categories.
  - `authorization.audit.test.ts`: Strict tenant isolation for farms, crops, assessments, documents, and admin endpoints.
  - `scoring.edgecases.test.ts`: Boundary condition audit (0, 49, 50, 74, 75, 100).
  - `scoring.engine.test.ts`: Determinism, category weights (1.0), penalties & bonuses.
  - `recommendations.test.ts`: Dynamic recommendation generation from weaknesses.
  - `evidence.test.ts`: Document audit and evidence quality score.
  - `validation.audit.test.ts`: Rejection of negative acreage, invalid crop years, and bad payloads.
  - `validation.test.ts`: Zod schema validation.
  - `demo.flow.test.ts`: End-to-end demo scenario (low score → upload doc & upgrade practice → recalculate → improved score → history).
  - `http.integration.test.ts`: Network socket HTTP tests for health, auth, farms, assessments, and admin.

---

## 📡 API Reference

Interactive API documentation with request/response schemas is hosted at:
👉 **`http://localhost:5000/api/docs`**

### Summary of Endpoints

#### System & Health
- `GET /health`: Health status check.
- `GET /ready`: Database connectivity check.

#### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new user / farmer account.
- `POST /api/auth/login`: Authenticate and receive JWT token.
- `GET /api/auth/me`: Get current authenticated user profile.

#### Farmer Profile (`/api/farmers`)
- `GET /api/farmers/me`: Get profile and farm summary for logged-in farmer.
- `PUT /api/farmers/me`: Update contact and location information.

#### Farms & Practices (`/api/farms`)
- `POST /api/farms`: Register a new farm with sustainable practices.
- `GET /api/farms`: List all farms belonging to current user (or all if Admin).
- `GET /api/farms/:id`: Get farm details including crop history, documents, and assessments.
- `PUT /api/farms/:id`: Update farm practices (tillage, residue, irrigation, fertilizers).
- `DELETE /api/farms/:id`: Delete a farm.
- `GET /api/farms/:farmId/assessments`: Get assessment history for farm.

#### Crop History (`/api/crops`)
- `POST /api/crops`: Add seasonal crop and yield record.
- `GET /api/crops/farm/:farmId`: List crop history for farm.
- `PUT /api/crops/:id`: Update crop record.
- `DELETE /api/crops/:id`: Delete crop record.

#### Documents & Evidence (`/api/documents`)
- `POST /api/documents/upload`: Multipart upload (PDF/JPG/PNG, max 10MB) with `farmId` and `type`.
- `GET /api/documents/farm/:farmId`: List documents with audit summary.
- `GET /api/documents/farm/:farmId/evidence-summary`: Get breakdown of verified, pending, and missing documents.
- `GET /api/documents/:id`: Get document metadata.
- `GET /api/documents/:id/download`: Download file.
- `PATCH /api/documents/:id/status`: Update review status (`VERIFIED`, `REVIEW_REQUIRED`, `REJECTED`).
- `DELETE /api/documents/:id`: Delete document.

#### Readiness Assessments (`/api/assessments`)
- `POST /api/assessments`: Run carbon-credit readiness assessment (`{ farmId }`).
- `GET /api/assessments/:id`: Get detailed assessment result with breakdown, strengths, gaps, and recommendations.
- `POST /api/assessments/:id/recalculate`: Recalculate assessment based on current farm state (creates new version).
- `GET /api/assessments/farm/:farmId`: Assessment history for progress chart.
- `PATCH /api/assessments/recommendations/:id/toggle`: Toggle recommendation completion.

#### Admin Analytics (`/api/admin`) *(Requires ADMIN role)*
- `GET /api/admin/dashboard`: Aggregated platform statistics, category averages, and top gaps.
- `GET /api/admin/farmers`: Paginated farmer list.
- `GET /api/admin/farms`: Paginated farm list with latest readiness level.
- `GET /api/admin/assessments`: Paginated assessments across all farms.
- `GET /api/admin/statistics`: Adoption rates for zero-till, micro-irrigation, mulching, and organic practices.
- `GET /api/admin/audit-logs`: Paginated audit log events.

---

## 🎯 Demo Walkthrough

The seeded database comes pre-configured with 4 demo accounts:

| Role | Email | Password | Baseline Score | Readiness Level |
|---|---|---|---|---|
| **Admin** | `admin@agricred.demo` | `Admin#2026` | N/A | N/A |
| **Low Farmer** | `farmer.suresh@agricred.demo` | `AgriCred#2026` | **23** | `NEEDS_IMPROVEMENT` |
| **Moderate Farmer** | `farmer.anil@agricred.demo` | `AgriCred#2026` | **74** | `MODERATE_READINESS` |
| **High Farmer** | `farmer.lakshmi@agricred.demo` | `AgriCred#2026` | **99** | `HIGH_READINESS` |

### Step-by-Step Live Demo Scenario

1. **Login as Farmer Suresh** (`farmer.suresh@agricred.demo` / `AgriCred#2026`).
2. **View Farm**: Inspect Suresh's farm (`Verma Wheat & Paddy Farm`) with flood irrigation, conventional tillage, and stubble burning.
3. **Start Assessment**: Call `POST /api/assessments`.
4. **Receive Score**: Overall score is **23** (`NEEDS_IMPROVEMENT`).
5. **View Breakdown**: Category breakdown shows low scores across all dimensions.
6. **Identify Gaps**: Gaps identify stubble burning, flood irrigation, and missing Land Deed + Soil Report.
7. **Upload Evidence & Upgrade Practices**:
   - Upload `LAND_DOCUMENT` and `SOIL_REPORT`.
   - Update farm practices (`PUT /api/farms/:id`) to **Drip Micro-Irrigation** and **In-situ Mulching**.
8. **Recalculate**: Call `POST /api/assessments/:id/recalculate`.
9. **Show Improved Score**: The new assessment score jumps to **> 55** (`MODERATE_READINESS`).
10. **View Assessment History**: Call `GET /api/farms/:farmId/assessments` to render the improvement progress chart (23 → 55+).
11. **Login as Admin** (`admin@agricred.demo` / `Admin#2026`): View dashboard at `GET /api/admin/dashboard` showing aggregated metrics, readiness distributions, and practice adoption rates.

---

## 🐳 Docker Deployment

Build and run using Docker:

```bash
# Build multi-stage image
docker build -t agricred-backend .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/agricred" \
  -e JWT_SECRET="your_secure_jwt_secret_key_minimum_16_characters" \
  agricred-backend
```
