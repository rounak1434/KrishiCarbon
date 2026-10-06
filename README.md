# 🌾 FarmerChoice

### Farmer Carbon Credit Readiness Assessment Platform

**MARTINOVATION 2026** • **Team Omnira**

*An objective, data-driven platform that evaluates smallholder and commercial farmer preparedness for voluntary carbon credit programs based on agricultural practices, land details, multi-season crop history, and verifiable documentary evidence.*

---

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-81%2F81%20Passing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 🏆 Hackathon

| Field | Details |
|---|---|
| **Hackathon** | MARTINOVATION 2026 |
| **Team** | Team Omnira |
| **Problem Statement** | Farmer Carbon Credit Readiness Assessment Platform |
| **Official Product** | FarmerChoice (formerly KrishiCarbon) |
| **Primary Repository** | `https://github.com/rounak1434/KrishiCarbon.git` |

---

## 🎯 Problem Statement

### The Challenge
Voluntary carbon credit programs offer smallholder and commercial farmers a pathway to monetize regenerative agricultural practices such as zero-tillage, residue retention, micro-irrigation, and organic soil enrichment. However, entering these markets presents severe real-world hurdles:

- **Lack of Baseline Awareness**: Farmers do not know whether their existing operational practices meet rigorous carbon registry methodologies.
- **Documentation Gaps**: Carbon verification standards require verifiable proof—including land deeds, laboratory soil health cards, irrigation logs, and crop yield records—which are often unorganized or missing.
- **High Friction & Inaccessibility**: Traditional carbon auditing requires expensive upfront verifications, creating an insurmountable barrier for smallholder farmers before they even know if their land qualifies.
- **Opacity**: Available guidance is fragmented, leaving farmers uncertain about what specific interventions will elevate their eligibility.

### Expected Outcome
The hackathon problem statement mandates an end-to-end platform that:
1. Evaluates farmer readiness based on **farming practices**, **land information**, **crop history**, **input usage**, **irrigation methods**, **soil-management practices**, and **available documentation**.
2. Delivers an **understandable, transparent readiness score (0–100)** and categorizes readiness into actionable tiers.
3. Identifies **additional information or actions required** to qualify.
4. Provides **actionable, prioritized guidance** to improve documentation and adopt high-impact regenerative practices.

---

## 💡 Our Solution

**FarmerChoice** is an end-to-end, data-driven readiness assessment platform built specifically to bridge the divide between agricultural field realities and carbon credit verification criteria.

Rather than relying on vague estimates or black-box predictions, FarmerChoice pairs a **100% deterministic, explainable scoring engine** with an **evidence management and audit pipeline**. Farmers input their agronomic profile and upload verifiable documentation, receiving an instant, transparent diagnostic of their preparedness.

```text
Farmer Onboarding & Auth
          │
          ▼
Farm Parcel Registration ──► (Acreage, Soil Type, Water Source, Tillage, Residue, Fertilizer)
          │
          ▼
Multi-Season Crop History ──► (Crops, Seasons, Yield Records, Nitrogen-Fixing Rotations)
          │
          ▼
Documentary Evidence ───────► (Land Deeds, Soil Tests, Mandi Receipts, Practice Photos)
          │
          ▼
┌────────────────────────────────────────────────────────┐
│             Server-Side Assessment Engine              │
│  - 6 Weighted Agronomic & Documentation Dimensions     │
│  - Zero Hardcoded Mock Data / Dynamic PostgreSQL State │
└──────────────────────────┬─────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
   Readiness Score                    Action Plan
  - 0–100 Scale                      - Strengths (Earned Points)
  - Prototype Readiness Tier         - Identified Gaps
  - Category Breakdown               - Prioritized Action Items
          │
          ▼
Practice Adoption & Document Upload ──► Non-Destructive Reassessment ──► Progress History Timeline
```

> [!IMPORTANT]
> **Prototype Assessment Model Notice**:
> FarmerChoice estimates preparedness based on configured agronomic parameters and verifiable documentary evidence. **FarmerChoice does not issue, verify, or certify carbon credits**, nor does it guarantee credit registration. It is an objective diagnostic tool designed to help farmers qualify for established voluntary market registries.

---

## 🌟 Key Features

### 1. Farmer & Farm Parcel Management
- **Secure Authentication**: Email-based signup and login secured by bcrypt (salt rounds: 10) and JWT bearer authentication.
- **Farmer Profile**: Structured capture of farmer identity, contact phone number, state, and district.
- **Multi-Parcel Support**: Farmers can register and manage multiple discrete farm plots, each maintaining its own soil characteristics, practices, and assessment history.
- **Comprehensive Agronomic Profile**: Tracks land area (acres), soil classification, irrigation infrastructure, water source, tillage regime, residue management, pesticide usage, and organic certification status.

### 2. Fertilizer Management (Engine v1.1.0)
- **Categorization**: Full support for `ORGANIC`, `SYNTHETIC`, and `INTEGRATED` nutrient management regimes.
- **Granular Organic Types**: Detailed selection of organic amendments:
  - Compost
  - Farmyard Manure (FYM)
  - Vermicompost
  - Biofertilizer
  - Green Manure
  - Other Organic Fertilizer
- **Objective Scoring**: Rewarding soil organic matter accumulation while penalizing excessive synthetic dependence.

### 3. Multi-Season Crop History
- **Historical Cropping Cycles**: Multi-year seasonal tracking (Kharif, Rabi, Zaid) including crop types and harvest yields.
- **Agronomic Rotation Analysis**: Detects crop diversification and rewards the integration of leguminous, nitrogen-fixing species (e.g., Chickpea, Lentil, Moong) that reduce synthetic nitrogen dependence.

### 4. Deterministic Readiness Assessment Engine
- **Server-Side Computation**: All calculations are executed strictly on the backend via PostgreSQL-persisted data. The client UI never computes scores.
- **Six Weighted Dimensions**: Evaluates farming practices (25%), soil management (20%), irrigation (15%), crop history (15%), documentation (15%), and evidence quality (10%).
- **Explainable Diagnostics**: Every assessment yields specific **Strengths** (practices earning points), **Gaps** (penalties or missing requirements), and detailed point-attribution **Factors**.
- **Dynamic Prioritized Recommendations**: Generates actionable next steps tagged `HIGH`, `MEDIUM`, or `LOW` priority with interactive completion tracking.
- **Non-Destructive Recalculation**: Rerunning an assessment creates a new chronological record, preserving full historical audit trails to visualize progress (e.g., 23 → 55 → 74 → 88).

### 5. Evidence & Document Management
- **Multi-Format Uploads**: Secure multipart file ingestion supporting PDF documents, JPEG, and PNG images up to 10MB.
- **Document Taxonomy**: Categorizes evidence into `LAND_DOCUMENT`, `SOIL_REPORT`, `CROP_RECORD`, `IRRIGATION_RECORD`, `FERTILIZER_RECORD`, `PRACTICE_PHOTO`, and `OTHER`.
- **Dual-Storage Abstraction**: Configured for seamless switching between local disk storage (`LocalDocumentStorageService`) during development and Cloudinary (`CloudinaryDocumentStorageService`) in production.
- **Evidence Audit Summary**: Automated gap detection reporting verified, pending, and missing required records for MRV compliance.
- **Verification Lifecycle**: Multi-state document tracking (`UPLOADED`, `PROCESSING`, `VERIFIED`, `REVIEW_REQUIRED`, `REJECTED`).

### 6. Administration & Regional Analytics
- **Role-Based Gatekeeping**: Dedicated `ADMIN` role protected by authorization middleware.
- **Regional Dashboard**: Aggregated overview of platform participants, total assessed acreage, and category averages.
- **Readiness Distribution**: Real-time breakdown of farms across readiness tiers.
- **Sustainable Practice Adoption Rates**: Automated metrics tracking adoption percentages for zero-tillage, micro-irrigation, residue retention (mulching/biochar), and organic fertilization.
- **Security Audit Logs**: Immutable recording of system actions (user registrations, practice updates, file uploads, assessments) with IP address logging.

---

## 🧠 Assessment Engine

The FarmerChoice Assessment Engine is **deterministic, server-side, explainable, and database-driven**. It implements an algorithmic scoring model defined in `scoring.config.ts`.

### Category Weights

The overall readiness score (0–100) is calculated as the weighted sum of six independent categories, each normalized to a 0–100 scale:

$$\text{Overall Score} = \sum_{i=1}^{6} (\text{Category Score}_i \times \text{Weight}_i)$$

| Assessment Category | Weight | Key Agronomic & Verification Factors |
|---|:---:|---|
| **Farming Practices** | **25%** | Conservation zero-tillage (+30 pts), residue mulching / biochar retention (+25 pts), certified organic practice (+15 pts), organic fertilizer adoption (+20 pts + subtype bonus), integrated nutrient management (+10 pts), stubble burning penalty (-40 pts), heavy synthetic dependence penalty (-15 pts). |
| **Soil Management** | **20%** | Soil organic carbon stabilization capacity (Black Cotton / Vertisol baseline +25 pts), minimal soil disturbance (+25 pts), organic nutrient amendments (+10 pts), verified laboratory soil health card (+25 pts). |
| **Irrigation** | **15%** | High-efficiency micro-irrigation (Drip / Sprinkler +35 pts), sustainable water sourcing (Rainwater harvesting pond / Canal / Solar borewell +20–30 pts), flood irrigation penalty (-15 pts). |
| **Crop History** | **15%** | Crop cycle diversity (≥3 distinct seasons +35 pts), yield stability documentation (+25 pts), nitrogen-fixing legume inclusion in rotation (+25 pts). |
| **Documentation** | **15%** | Verifiable presence of required MRV records: Land Title / Lease Deed (+25 pts), Soil Carbon Health Card (+30 pts), Mandi Harvest / Sales Receipts (+15 pts), Irrigation Logs (+15 pts), Input Purchase Vouchers (+15 pts). |
| **Evidence Quality** | **10%** | Ratio of verified documents to total expected documents, geotagged practice photos, and document completeness score. |
| **Total** | **100%** | **Normalized Composite Readiness Score (0–100)** |

### Prototype Readiness Tiers

Configured in `scoring.config.ts`, assessments are classified into three prototype tiers:

| Score Range | Classification | Status Label | Typical Profile & Action Path |
|:---:|:---:|:---:|---|
| **0 – 49** | `NEEDS_IMPROVEMENT` | Needs Improvement | Conventional practices (deep tillage, flood irrigation, chemical reliance, stubble clearing), missing documentation, and absence of baseline soil test reports. Immediate intervention required on residue retention and basic record keeping. |
| **50 – 74** | `MODERATE_READINESS` | Moderate Readiness | Established sustainable practices (e.g., drip irrigation or integrated fertilizers) with partial documentation. Needs verified soil test cards and systematic multi-season input logs to meet registry auditing criteria. |
| **75 – 100** | `HIGH_READINESS` | High Readiness | Advanced regenerative management (zero-till, in-situ residue mulching, verified organic amendments, leguminous crop rotation) supported by verified land and soil test documentation. Primed for formal MRV onboarding. |

---

## 🌿 Organic Fertilizer Support

Nutrient management directly affects nitrous oxide ($\text{N}_2\text{O}$) emissions and soil organic matter buildup. The scoring engine evaluates fertilizer practices through strict deterministic logic:

```
                            Nutrient Input Mode
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
      ORGANIC                   INTEGRATED                   SYNTHETIC
   (+20 pts Practices)         (+10 pts Practices)         (0 pts Baseline)
   (+10 pts Soil Mgt)          (+5 pts Soil Mgt)           (-15 pts if Heavy / Excessive)
         │                           │                           │
         ▼                           ▼                           ▼
   Type Bonus:               Balanced Nutrient            Transition Advice
   • Vermicompost: +5 pts    Management Commendation     Generated in Dynamic
   • Biofertilizer: +4 pts                               Recommendations
   • Green Manure: +4 pts
   • Compost: +3 pts
   • Farmyard Manure: +2 pts
   • Other: +2 pts
```

- **Explainability**: When organic fertilizer is selected, the engine highlights soil carbon enrichment in the farm's Strengths and suppresses unnecessary synthetic reduction recommendations.
- **Truthful Baseline**: When fertilizer details are unrecorded, the engine awards 0 points (neutral baseline) without making assumptions, flagging missing input records as a gap.

---

## 📁 Evidence & Document System

Verification standards require physical proof of claimed practices. FarmerChoice features an evidence pipeline designed for strict data integrity:

```text
┌──────────────┐     Multer (Memory/Disk)      ┌─────────────────────────────┐
│  Farmer PDF  │ ────────────────────────────► │   Document Storage Service  │
│  JPEG / PNG  │     Size Limit: 10MB          │  - Local (Development)      │
└──────────────┘                               │  - Cloudinary (Production)  │
                                               └──────────────┬──────────────┘
                                                              │
                                                              ▼
┌──────────────────────────────┐                ┌─────────────────────────────┐
│   Automated Verification     │ ◄───────────── │  DocumentExtractionService  │
│  - AI-Assisted (if API key)  │                │  - Optional Gemini/OpenAI   │
│  - Heuristic (safe fallback) │                │  - Status: REVIEW_REQUIRED  │
└──────────────────────────────┘                └─────────────────────────────┘
```

- **Supported MIME Types**: `application/pdf`, `image/jpeg`, `image/png`.
- **Enforced File Size**: 10MB maximum file size enforced via Multer middleware.
- **Tenant Security**: Farmers can only upload and query documents tied to parcels they own. All database queries enforce strict ownership verification.
- **Lifecycle States**:
  - `UPLOADED`: File received and stored.
  - `PROCESSING`: Undergoing automated extraction or inspection.
  - `VERIFIED`: Confirmed authentic and relevant to the farm.
  - `REVIEW_REQUIRED`: Default state when automated extraction is unavailable; flagged for manual auditor review.
  - `REJECTED`: File illegible, corrupted, or irrelevant.

---

## 🤖 AI / Intelligent Processing

FarmerChoice enforces a clear architectural boundary between deterministic calculations and optional AI services:

### 1. Deterministic Scoring Engine (Zero LLM Dependency)
- The readiness score (0–100), category scores, strengths, gaps, and recommendations are **100% computed via deterministic TypeScript logic**.
- The scoring engine never relies on LLM prompts to calculate numbers, eliminating hallucinations, latency spikes, or arbitrary score variations.

### 2. AI-Assisted Document Extraction (`DocumentExtractionService`)
- Uploaded soil test reports, land deeds, and receipts can optionally be parsed by an AI service when `AI_API_KEY` is configured in the environment.
- **Graceful Fallback**: If `AI_API_KEY` is empty, unconfigured, or fails to respond, the system does not fail or halt. It executes a fallback heuristic, safely registers the document, sets its status to `REVIEW_REQUIRED`, and leaves extracted values as `null` for human verification.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Render Static Site / Vite)"]
        UI["FarmerChoice Single-Page App"]
        AUTH_UI["Auth & Session Controller"]
        ASSESS_UI["Assessment & Progress UI"]
        DOC_UI["Document Upload & Evidence Audit"]
        ADMIN_UI["Admin Analytics Dashboard"]
    end

    subgraph API_GW["API Layer (Express 5 + TypeScript)"]
        HELMET["Helmet HTTP Security"]
        CORS["CORS Policy Enforcement"]
        RATE["Express Rate Limiter"]
        ROUTERS["Modular Express Routers (/api/*)"]
    end

    subgraph Services["Core Application Services"]
        AUTH_SVC["Auth Service (Bcrypt + JWT)"]
        FARM_SVC["Farm & Crop Management"]
        EVID_SVC["Evidence & Extraction Service"]
        ENGINE["Deterministic Assessment Engine v1.1.0"]
        RECOM_SVC["Recommendation Service"]
        ADMIN_SVC["Admin Analytics & Audit Service"]
    end

    subgraph StorageLayer["Data & Persistence Layer"]
        PRISMA["Prisma ORM (v6.x)"]
        PG[("PostgreSQL Database (Supabase / Local)")]
        STORAGE_ABS["IDocumentStorageService Abstraction"]
        LOCAL_DISK["Local File Storage (Dev)"]
        CLOUDINARY["Cloudinary Storage (Prod)"]
    end

    UI --> API_GW
    AUTH_UI --> API_GW
    ASSESS_UI --> API_GW
    DOC_UI --> API_GW
    ADMIN_UI --> API_GW

    API_GW --> ROUTERS
    ROUTERS --> AUTH_SVC
    ROUTERS --> FARM_SVC
    ROUTERS --> EVID_SVC
    ROUTERS --> ENGINE
    ROUTERS --> ADMIN_SVC

    ENGINE --> RECOM_SVC
    ENGINE --> EVID_SVC

    AUTH_SVC --> PRISMA
    FARM_SVC --> PRISMA
    ENGINE --> PRISMA
    ADMIN_SVC --> PRISMA
    EVID_SVC --> PRISMA

    EVID_SVC --> STORAGE_ABS
    STORAGE_ABS -. Dev .-> LOCAL_DISK
    STORAGE_ABS -. Prod .-> CLOUDINARY

    PRISMA --> PG
```

### Data-Driven Architecture & Zero Runtime Mock Policy

FarmerChoice enforces strict data-integrity guarantees across the entire platform lifecycle:
- **Server-Side Assessment Authority**: The frontend client never computes scores, category weights, or readiness classifications. It serves exclusively as a presentation layer rendering verified data returned by the backend.
- **Relational PostgreSQL Persistence**: All farmer profiles, farm parcels, agronomic practices, multi-season crop cycles, document metadata, assessment runs, category scores, and recommendations are persisted in PostgreSQL via Prisma ORM.
- **Dynamic Recommendations**: Action items and guidance are dynamically derived from actual assessment deficiencies and weaknesses—not hardcoded static arrays.
- **Empty Database Resilience**: The platform operates cleanly with zero records in the database. All endpoints return predictable empty states or 404 responses without crashing or synthesizing fake records (`empty.database.test.ts` verified).
- **Separation of Test Fixtures**: Optional development fixtures (`npm run db:seed`) are strictly reserved for local evaluation. Production environments execute empty migrations (`npx prisma migrate deploy`), guaranteeing that live metrics reflect real farmers.

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **HTML5 & CSS3** | Standard | Semantic, responsive interface with custom CSS styling |
| **JavaScript (ES Modules)** | ES2022+ | Reactive state management, async REST communication, dynamic form wizard |
| **Vite** | `^6.2.0` | Production bundling, live development server, asset optimization |
| **Typography** | Inter | Modern sans-serif typography via Google Fonts |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | `>=20.0.0` | High-performance asynchronous JavaScript runtime |
| **Express** | `^5.2.1` | Next-generation REST API framework with native async error handling |
| **TypeScript** | `^6.0.3` | End-to-end static type safety across data models and services |
| **tsx** | `^4.23.15` | Fast zero-config TypeScript execution and live watching |
| **Zod** | `^4.6.5` | Strict schema validation for API request bodies and query parameters |
| **Swagger UI Express** | `^5.0.1` | Interactive OpenAPI documentation hosted at `/api/docs` |

### Database & ORM
| Technology | Version | Purpose |
|---|---|---|
| **Prisma ORM** | `^6.19.3` | Type-safe database queries, schema migrations, and relational modeling |
| **PostgreSQL** | `>=16.0` | ACID-compliant relational storage (Supabase hosted in production) |

### Storage, Security & DevOps
| Technology | Version | Purpose |
|---|---|---|
| **Cloudinary SDK** | `^2.11.0` | Cloud document storage for PDFs and images in production |
| **Multer** | `^2.4.0` | Multipart file upload handling with strict 10MB size limits |
| **Bcrypt** | `^6.0.0` | Secure one-way password hashing (salt factor 10) |
| **JSONWebToken** | `^9.0.3` | Signed bearer token authentication |
| **Helmet** | `^8.3.0` | HTTP security headers (CSP, HSTS, X-Content-Type-Options) |
| **Express Rate Limit** | `^8.7.0` | Brute-force and DDoS protection across all API routes |
| **Vitest** | `^5.0.3` | High-speed unit, integration, and security test runner |
| **Render** | Cloud | Production hosting via Blueprint (`render.yaml`) |

---

## 📡 API Reference & Contracts

Interactive OpenAPI / Swagger documentation is available at:
👉 **`http://localhost:5000/api/docs`** (or deployed backend `/api/docs`)

### Standard Response Envelope
All API endpoints adhere to a consistent JSON structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | BAD_REQUEST",
    "message": "Human-readable explanation of error",
    "details": [ ... ]
  }
}
```

### Core API Endpoints

| Category | Method | Endpoint | Auth | Description |
|---|---|---|:---:|---|
| **System** | `GET` | `/health` | Public | Service health status and timestamp |
| | `GET` | `/ready` | Public | PostgreSQL database connectivity probe |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new farmer account and profile |
| | `POST` | `/api/auth/login` | Public | Authenticate credentials and receive JWT |
| | `GET` | `/api/auth/me` | Bearer | Get authenticated user profile and farms |
| **Farmers** | `GET` | `/api/farmers/me` | Bearer | Get farmer details and associated parcels |
| | `PUT` | `/api/farmers/me` | Bearer | Update farmer contact and regional profile |
| **Farms** | `POST` | `/api/farms` | Bearer | Create a new farm parcel with practices |
| | `GET` | `/api/farms` | Bearer | List user's farms (or all farms if Admin) |
| | `GET` | `/api/farms/:id` | Bearer | Get farm details, crops, docs, assessments |
| | `PUT` | `/api/farms/:id` | Bearer | Update farm practices (tillage, residue, fertilizer) |
| | `DELETE`| `/api/farms/:id` | Bearer | Remove a farm parcel |
| **Crops** | `POST` | `/api/crops` | Bearer | Add a seasonal crop and harvest yield record |
| | `GET` | `/api/crops/farm/:farmId` | Bearer | List multi-season crop history for farm |
| | `PUT` | `/api/crops/:id` | Bearer | Update an existing crop record |
| | `DELETE`| `/api/crops/:id` | Bearer | Delete a crop record |
| **Evidence** | `POST` | `/api/documents/upload` | Bearer | Multipart upload (PDF/JPG/PNG, max 10MB) |
| | `GET` | `/api/documents/farm/:farmId` | Bearer | List documents and audit status for farm |
| | `GET` | `/api/documents/farm/:farmId/evidence-summary` | Bearer | Breakdown of verified, pending, and missing evidence |
| | `GET` | `/api/documents/:id/download` | Bearer | Download / retrieve evidence file |
| | `PATCH`| `/api/documents/:id/status` | Admin | Update verification status (`VERIFIED`, etc.) |
| | `DELETE`| `/api/documents/:id` | Bearer | Delete document record |
| **Assessments** | `POST` | `/api/assessments` | Bearer | Run server-side readiness assessment |
| | `GET` | `/api/assessments/:id` | Bearer | Retrieve assessment breakdown and recommendations |
| | `POST` | `/api/assessments/:id/recalculate` | Bearer | Recalculate assessment based on new data |
| | `GET` | `/api/farms/:farmId/assessments` | Bearer | Chronological assessment history for farm |
| | `PATCH`| `/api/assessments/recommendations/:id/toggle` | Bearer | Toggle recommendation completion status |
| **Admin** | `GET` | `/api/admin/dashboard` | Admin | Aggregated platform metrics and category averages |
| | `GET` | `/api/admin/farmers` | Admin | Paginated list of registered farmers |
| | `GET` | `/api/admin/farms` | Admin | Paginated farms list with latest readiness tiers |
| | `GET` | `/api/admin/statistics` | Admin | Sustainable practice adoption rates |
| | `GET` | `/api/admin/audit-logs` | Admin | System audit trail with action and IP details |

---

## 🛡️ Security & Data Integrity

1. **Authentication & Authorization**:
   - Passwords hashed with bcrypt (salt factor: 10).
   - JWT tokens signed with SHA-256 HMAC (`JWT_SECRET`, default 7-day expiration).
   - Strict tenant isolation: Farmers cannot read, modify, or upload evidence to parcels owned by other farmers.
2. **Input Validation**:
   - Every incoming request body and query parameter is validated against Zod schemas before hitting business logic.
   - Rejects negative acreage, invalid crop years, unapproved MIME types, or oversized files (>10MB).
3. **Infrastructure Hardening**:
   - `helmet()` middleware sets standard HTTP security headers.
   - `express-rate-limit` limits abuse (100 requests per 15 minutes per IP on `/api`).
   - Server explicitly binds to `0.0.0.0` for containerized environments.
4. **Secrets Management**:
   - Zero hardcoded credentials. All secrets injected via environment variables.
   - Centralized error-handling middleware sanitizes all 500 error responses in production, preventing database connection strings or stack traces from leaking to clients.
5. **Audit Logging**:
   - Key platform actions (user registration, farm practice edits, document uploads, assessment evaluations) create immutable records in the `AuditLog` table.

---

## 🗄️ Database Architecture

The data architecture is managed via Prisma ORM targeting PostgreSQL:

```text
┌─────────────────┐       1:1       ┌──────────────────┐
│      User       │ ──────────────► │      Farmer      │
│  (Auth & Role)  │                 │ (Profile Details)│
└────────┬────────┘                 └────────┬─────────┘
         │                                   │ 1:N
         │ 1:N                               ▼
         │                          ┌──────────────────┐
         │                          │       Farm       │
         │                          │(Parcel Practices)│
         │                          └────────┬─────────┘
         │                                   │
         │         ┌─────────────────────────┼─────────────────────────┐
         │         ▼ 1:N                     ▼ 1:N                     ▼ 1:N
         │  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
         │  │ CropHistory  │          │   Document   │          │  Assessment  │
         │  └──────────────┘          └──────────────┘          └──────┬───────┘
         ▼                                                             │ 1:N
┌─────────────────┐                                    ┌───────────────┴───────────────┐
│    AuditLog     │                                    ▼                               ▼
└─────────────────┘                         ┌───────────────────────┐      ┌──────────────────────┐
                                            │AssessmentCategoryScore│      │    Recommendation    │
                                            └───────────────────────┘      └──────────────────────┘
```

### Prisma Models Summary

| Model | Purpose |
|---|---|
| `User` | Authentication credentials, role (`FARMER` or `ADMIN`), timestamps |
| `Farmer` | Demographic profile (name, phone, state, district) linked to `User` |
| `Farm` | Farm parcel details (acreage, soil classification, irrigation method, water source, tillage, residue, fertilizer category, organic fertilizer type, pesticide usage, organic certification flag) |
| `CropHistory` | Multi-season cropping history (crop name, season, year, yield) |
| `Document` | Uploaded evidence metadata (type, filename, storage URL, MIME type, file size, status, extracted JSON data) |
| `Assessment` | Historical assessment run (overall score, readiness level, engine version, summary JSON) |
| `AssessmentCategoryScore` | Normalized category scores and weights for an assessment run |
| `Recommendation` | Dynamic action items linked to assessment (`priority`, `category`, `message`, `completed`) |
| `AuditLog` | Immutable event log (`action`, `entityType`, `entityId`, `details`, `ipAddress`) |

---

## ☁️ Deployment Architecture

FarmerChoice is configured and prepared for one-click production deployment using Render, Supabase, and Cloudinary.

> [!NOTE]
> **Deployment Status: Prepared for Deployment (Production Target)**
> The codebase and infrastructure are fully verified and prepared (`0.0.0.0` host binding, dynamic `PORT`, CORS policies, Prisma migration deploy script, Cloudinary storage abstraction, and 81/81 passing test suite). The URLs shown below represent the designated target endpoints upon linking live services in the Render dashboard.

```text
┌─────────────────────────────────────────────────────────────┐
│                    FarmerChoice Frontend                    │
│          (Vercel / Render Static Site: HTML5 / CSS / JS)    │
│            https://krishi-carbon.vercel.app                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST & Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FarmerChoice Backend                     │
│               (Render Web Service: Node / Express)          │
│            https://krishicarbon.onrender.com                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Supabase PostgreSQL     │ │         Cloudinary         │
│     (Hosted Relational DB)   │ │  (Encrypted Cloud Storage) │
│  - Prisma Migration Pool     │ │  - Evidence Documents      │
│  - Zero Seed Data Policy     │ │  - PDFs, Soil Cards, JPEGs │
│  - Connection Pooling        │ │  - 10MB Upload Limit       │
└──────────────────────────────┘ └────────────────────────────┘
```

### Render Blueprint Deployment (`render.yaml`)

The repository root includes a ready-to-deploy `render.yaml` specification that provisions:
1. **Backend Web Service** (`krishicarbon-backend`):
   - Runtime: Node.js 20
   - Root Directory: `KrishiCarbon-backend`
   - Build Command: `npm install && npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Health Check: `/health`
2. **Frontend Static Site** (`krishicarbon-frontend`):
   - Root Directory: `KrishiCarbon-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - SPA Rewrite Rule: `/*` ➔ `/index.html`

---

## 🚀 Local Setup Guide

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16.x` or higher (running locally or a cloud instance such as Supabase / Neon)

### 1. Clone Repository

```bash
git clone https://github.com/rounak1434/KrishiCarbon.git
cd KrishiCarbon
```

### 2. Configure Backend

```bash
cd KrishiCarbon-backend

# Copy environment template
cp .env.example .env
```

Edit `.env` with your database connection details:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/krishicarbon?schema=public"
JWT_SECRET="krishicarbon_hackathon_super_secret_jwt_key_2026_dev"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:4173"
STORAGE_PROVIDER="local"
STORAGE_PATH="./uploads"
AI_API_KEY=""
```

Install dependencies and run database migrations:
```bash
npm install

# Generate Prisma Client
npm run prisma:generate

# Apply Migrations
npm run prisma:migrate

# (Optional) Seed Demo Accounts for Hackathon Evaluation
npm run db:seed
```

Start backend development server:
```bash
npm run dev
# Server running at http://localhost:5000
# OpenAPI Docs at http://localhost:5000/api/docs
```

### 3. Configure Frontend

In a separate terminal:
```bash
cd KrishiCarbon-frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` points to your running backend:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

Start the Vite development server:
```bash
npm run dev
# Frontend running at http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### Backend (`KrishiCarbon-backend/.env`)

| Variable | Required | Default / Example | Purpose |
|---|:---:|---|---|
| `PORT` | Optional | `5000` | Port for Express HTTP server |
| `NODE_ENV` | Yes | `development` or `production` | Runtime mode |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | 32+ character random string | HMAC secret for JWT signing |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token lifetime |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed origin(s) (comma-separated) |
| `STORAGE_PROVIDER` | Yes | `local` (dev) / `cloudinary` (prod) | Active document storage driver |
| `STORAGE_PATH` | Cond. | `./uploads` | Local upload directory if `STORAGE_PROVIDER=local` |
| `CLOUDINARY_CLOUD_NAME` | Cond. | `your_cloud_name` | Required if `STORAGE_PROVIDER=cloudinary` |
| `CLOUDINARY_API_KEY` | Cond. | `your_api_key` | Required if `STORAGE_PROVIDER=cloudinary` |
| `CLOUDINARY_API_SECRET` | Cond. | `your_api_secret` | Required if `STORAGE_PROVIDER=cloudinary` |
| `CLOUDINARY_FOLDER` | Optional | `krishicarbon_documents` | Target folder in Cloudinary |
| `AI_API_KEY` | Optional | `""` | Optional LLM API key for document extraction |

### Frontend (`KrishiCarbon-frontend/.env`)

| Variable | Required | Example | Purpose |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api` | Full URL to the backend `/api` endpoint |

---

## 🧪 Testing & Verification

FarmerChoice features an extensive automated test suite covering unit determinism, data-driven reactivity, boundary edge cases, authorization isolation, and live HTTP socket communication.

### Run Automated Tests

```bash
cd KrishiCarbon-backend
npm test
```

### Current Test Suite Status
**12 Test Suites • 81 Tests • 100% Passing**

```text
 ✓ tests/http.integration.test.ts (12 tests)
 ✓ tests/empty.database.test.ts (9 tests)
 ✓ tests/authorization.audit.test.ts (13 tests)
 ✓ tests/data.driven.audit.test.ts (7 tests)
 ✓ tests/validation.audit.test.ts (6 tests)
 ✓ tests/demo.flow.test.ts (5 tests)
 ✓ tests/organic.fertilizer.test.ts (12 tests)
 ✓ tests/validation.test.ts (4 tests)
 ✓ tests/scoring.engine.test.ts (6 tests)
 ✓ tests/scoring.edgecases.test.ts (3 tests)
 ✓ tests/evidence.test.ts (2 tests)
 ✓ tests/recommendations.test.ts (2 tests)

 Test Files  12 passed (12)
      Tests  81 passed (81)
   Duration  6.97s
```

### Automated Production Smoke Test
A standalone, non-destructive smoke test script is provided in `scripts/production-smoke-test.mjs`. It validates 13 critical end-to-end integration steps against a live deployed or local API:

```bash
PRODUCTION_API_URL=http://localhost:5000/api node scripts/production-smoke-test.mjs
```

1. `GET /health` service status verification
2. `GET /ready` database connectivity verification
3. Dynamic farmer registration
4. Credential authentication and JWT issuance
5. Farm parcel creation with organic fertilizer practices
6. Multi-season crop history registration
7. Deterministic readiness assessment calculation
8. Evidence document upload via storage abstraction
9. Farm practice modification
10. Assessment recalculation and version tracking
11. Chronological assessment history timeline integrity
12. Session persistence verification
13. Safe, non-destructive test artifact cleanup

---

## 📂 Repository Structure

```text
KrishiCarbon/
├── README.md                           # Main GitHub documentation (this file)
├── HANDOFF.md                          # Repository status & developer handoff guide
├── render.yaml                         # Production Render Blueprint specification
│
├── docs/                               # Architecture and deployment documentation
│   └── PRODUCTION_DEPLOYMENT.md        # Comprehensive production rollout guide
│
├── scripts/                            # Operational & verification scripts
│   └── production-smoke-test.mjs       # 13-step non-destructive automated smoke test
│
├── KrishiCarbon-frontend/              # Official Frontend Application
│   ├── index.html                      # Semantic single-page application structure
│   ├── app.js                          # Client controllers, wizards, and UI state
│   ├── api.js                          # Typed HTTP client communicating with backend
│   ├── styles.css                      # Custom responsive CSS design system
│   ├── package.json                    # Frontend dependencies and Vite scripts
│   └── verify-integration.mjs          # Client-side integration test script
│
└── KrishiCarbon-backend/               # Official Backend Application
    ├── package.json                    # Backend dependencies & scripts
    ├── tsconfig.json                   # TypeScript compiler configuration
    ├── Dockerfile                      # Production container specification
    │
    ├── prisma/                         # Database schema & migrations
    │   ├── schema.prisma               # Prisma data models and enums
    │   ├── seed.ts                     # Demo fixtures for evaluation
    │   └── migrations/                 # PostgreSQL migration history
    │
    ├── src/                            # Application Source Code
    │   ├── server.ts                   # HTTP listener with 0.0.0.0 binding
    │   ├── app.ts                      # Express app setup, CORS, Helmet, routes
    │   ├── config/                     # Zod env schema, Prisma client, Swagger
    │   ├── middleware/                 # Auth, RBAC, Multer, Rate limiting, Errors
    │   ├── modules/                    # Modular domain controllers and routes
    │   │   ├── auth/                   # Registration, login, profile retrieval
    │   │   ├── farmers/                # Farmer demographics and profile updates
    │   │   ├── farms/                  # Farm parcels & sustainable practices
    │   │   ├── crops/                  # Seasonal crop history and yields
    │   │   ├── documents/              # File uploads, storage abstraction, audits
    │   │   ├── assessments/            # Assessment execution and recalculation
    │   │   └── admin/                  # Governance, adoption stats, audit logs
    │   ├── engine/                     # Core Business Engines
    │   │   ├── scoring/                # Deterministic assessment algorithm & config
    │   │   ├── evidence/               # Evidence auditing & extraction service
    │   │   └── recommendations/        # Dynamic prioritized recommendation engine
    │   └── utils/                      # Logger, response envelope, custom errors
    │
    └── tests/                          # Automated Vitest test suites (81 tests)
```

---

## ⚠️ Known Limitations & Scope

- **Prototype Readiness Model**: FarmerChoice is an assessment tool designed to evaluate preparedness for voluntary carbon credit methodologies. It is **not** an accredited carbon credit registry (e.g., Verra VCS, Gold Standard, Indian Carbon Market) and does not issue tradable carbon credits.
- **Render Free-Tier Cold Starts**: On free Render instances, the web service spins down after 15 minutes of inactivity; initial cold starts may require 30–50 seconds.
- **Connection Pooling**: When deploying with Supabase free tier, using the transaction pooler (`?pgbouncer=true&connection_limit=1`) is recommended to avoid exceeding database connection limits.
- **Manual Verification Fallback**: Without a configured `AI_API_KEY`, uploaded documents default to `REVIEW_REQUIRED` status, requiring an administrator to verify documents before full evidence points are credited.

---

## 🔮 Future Roadmap

- **Satellite Remote Sensing Integration**: Ingesting Sentinel-2 and Landsat multispectral imagery to calculate NDVI, NDWI, and verify in-situ cover crop practices and tillage reduction remotely.
- **Direct Registry API Connectors**: Streamlined export of farmer evidence packages directly into registries like Verra, Gold Standard, and the Indian Carbon Market framework.
- **Automated Soil Lab API Ingestion**: Direct integration with government and private soil testing laboratories to fetch Soil Health Cards without manual uploads.
- **Multilingual Voice Interface**: Localized voice and conversational assistance in regional Indian languages (Hindi, Marathi, Telugu, Bengali) to expand accessibility for rural farmers.

---

## 👥 Team Omnira

Built with passion for **MARTINOVATION 2026**.

| Team | Hackathon | Problem Statement |
|---|---|---|
| **Team Omnira** | **MARTINOVATION 2026** | **Farmer Carbon Credit Readiness Assessment Platform** |

---

*FarmerChoice — Empowering farmers with transparent, data-driven readiness for sustainable carbon futures.*
