# AgriCred API Contract — Frontend Integration Guide

This document is the official API contract for the frontend application. It specifies exact endpoints, authentication requirements, request payloads, and standard response formats.

Base URL: `http://localhost:5000` (configurable via `VITE_API_URL` or `NEXT_PUBLIC_API_URL`).

---

## Standard Response Format

All responses follow a predictable JSON envelope:

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | BAD_REQUEST",
    "message": "Human-readable explanation of error",
    "details": [ ... ]
  }
}
```

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Demo Accounts for Testing
- **Admin**: `admin@agricred.demo` / `Admin#2026`
- **Low-Readiness Farmer**: `farmer.suresh@agricred.demo` / `AgriCred#2026` (Score ~23)
- **Moderate-Readiness Farmer**: `farmer.anil@agricred.demo` / `AgriCred#2026` (Score ~74)
- **High-Readiness Farmer**: `farmer.lakshmi@agricred.demo` / `AgriCred#2026` (Score ~99)

---

## Endpoints

### 1. User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public

#### Request Body
```json
{
  "email": "farmer.lakshmi@agricred.demo",
  "password": "AgriCred#2026"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "58135af6-eafa-40e3-ab76-c153d0a6bf2a",
      "email": "farmer.lakshmi@agricred.demo",
      "role": "FARMER",
      "createdAt": "2026-10-05T09:55:40.721Z",
      "farmer": {
        "id": "0ebea424-2e76-42c2-91d4-faf4f86e62b4",
        "name": "Lakshmi Devi",
        "phone": "+91 99123 44556",
        "state": "Maharashtra",
        "district": "Amravati"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

---

### 2. Get Current Authenticated Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Required (`Bearer <token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "58135af6-eafa-40e3-ab76-c153d0a6bf2a",
    "email": "farmer.lakshmi@agricred.demo",
    "role": "FARMER",
    "createdAt": "2026-10-05T09:55:40.721Z",
    "farmer": {
      "id": "0ebea424-2e76-42c2-91d4-faf4f86e62b4",
      "name": "Lakshmi Devi",
      "phone": "+91 99123 44556",
      "state": "Maharashtra",
      "district": "Amravati",
      "createdAt": "2026-10-05T09:55:40.721Z",
      "farms": [
        {
          "id": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
          "name": "Pragati Regenerative Organics",
          "areaAcres": 20.0,
          "createdAt": "2026-10-05T09:55:40.725Z"
        }
      ]
    }
  }
}
```

---

### 3. Create a Farm
- **Endpoint**: `POST /api/farms`
- **Auth**: Required

#### Request Body
```json
{
  "name": "Green Valley Farm",
  "areaAcres": 15.5,
  "soilType": "Black Cotton Soil",
  "irrigationMethod": "Drip Irrigation",
  "waterSource": "Rainwater Harvesting Pond",
  "fertilizerUsage": "Biofertilizers & Vermicompost",
  "fertilizerCategory": "ORGANIC",
  "organicFertilizerType": "VERMICOMPOST",
  "pesticideUsage": "Integrated Pest Management (Neem)",
  "tillageMethod": "Zero Tillage",
  "residueManagement": "In-situ Mulching & Biochar",
  "organicPractices": true
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
    "farmerId": "0ebea424-2e76-42c2-91d4-faf4f86e62b4",
    "name": "Green Valley Farm",
    "areaAcres": 15.5,
    "soilType": "Black Cotton Soil",
    "irrigationMethod": "Drip Irrigation",
    "waterSource": "Rainwater Harvesting Pond",
    "fertilizerUsage": "Biofertilizers & Vermicompost",
    "fertilizerCategory": "ORGANIC",
    "organicFertilizerType": "VERMICOMPOST",
    "pesticideUsage": "Integrated Pest Management (Neem)",
    "tillageMethod": "Zero Tillage",
    "residueManagement": "In-situ Mulching & Biochar",
    "organicPractices": true,
    "createdAt": "2026-10-05T10:00:00.000Z",
    "updatedAt": "2026-10-05T10:00:00.000Z"
  }
}
```

---

### 4. Get Farm Details By ID
- **Endpoint**: `GET /api/farms/:id`
- **Auth**: Required

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
    "name": "Pragati Regenerative Organics",
    "areaAcres": 20.0,
    "soilType": "Black Cotton Soil (Vertisol)",
    "irrigationMethod": "Drip Micro-Irrigation",
    "waterSource": "Rainwater Harvesting Farm Pond & Solar Borewell",
    "fertilizerUsage": "Biofertilizers, Vermicompost & Jeevamrutha",
    "pesticideUsage": "Integrated Pest Management (Neem & Pheromone Traps)",
    "tillageMethod": "Zero Tillage with Seed Drill",
    "residueManagement": "In-situ Mulching & Biochar Incorporation",
    "organicPractices": true,
    "farmer": {
      "id": "0ebea424-2e76-42c2-91d4-faf4f86e62b4",
      "name": "Lakshmi Devi",
      "phone": "+91 99123 44556",
      "state": "Maharashtra",
      "district": "Amravati"
    },
    "crops": [
      {
        "id": "90e6e2fa-...",
        "crop": "Chickpea (Desi Chana)",
        "season": "Rabi",
        "year": 2024,
        "yield": 2.2
      }
    ],
    "documents": [
      {
        "id": "31b2649b-...",
        "type": "SOIL_REPORT",
        "filename": "icar_soil_carbon_test_2024.pdf",
        "mimeType": "application/pdf",
        "fileSize": 840000,
        "status": "VERIFIED",
        "createdAt": "2026-10-05T09:55:40.755Z"
      }
    ],
    "assessments": [
      {
        "id": "78ad4e42-...",
        "overallScore": 99,
        "readinessLevel": "HIGH_READINESS",
        "createdAt": "2026-10-05T09:55:40.760Z"
      }
    ]
  }
}
```

---

### 5. Add Crop History
- **Endpoint**: `POST /api/crops`
- **Auth**: Required

#### Request Body
```json
{
  "farmId": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
  "crop": "Chickpea (Desi Chana)",
  "season": "Rabi",
  "year": 2024,
  "yield": 2.2
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "90e6e2fa-...",
    "farmId": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
    "crop": "Chickpea (Desi Chana)",
    "season": "Rabi",
    "year": 2024,
    "yield": 2.2,
    "createdAt": "2026-10-05T10:05:00.000Z"
  }
}
```

---

### 6. Create / Run Readiness Assessment
- **Endpoint**: `POST /api/assessments`
- **Auth**: Required

#### Request Body
```json
{
  "farmId": "2334f590-7d6f-40c9-940f-7b7c20c02fa2"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "78ad4e42-63a5-4eb4-96fe-bf38166adca6",
    "farmId": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
    "overallScore": 88,
    "status": "HIGH_READINESS",
    "readinessLevel": "HIGH_READINESS",
    "readinessLabel": "High Readiness",
    "engineVersion": "1.0.0",
    "categories": {
      "farmingPractices": 95,
      "soilManagement": 90,
      "irrigation": 95,
      "cropHistory": 85,
      "documentation": 80,
      "evidenceQuality": 80
    },
    "strengths": [
      "In-situ residue retention/mulching retains organic biomass and builds soil organic matter",
      "Zero/No-tillage practice prevents soil disturbance and preserves mycorrhizal fungal networks",
      "Certified or demonstrated organic management reduces synthetic input emissions",
      "Drip micro-irrigation optimizes water use efficiency and mitigates nitrous oxide volatilization",
      "Verified laboratory soil test report available for baseline carbon and nutrient profiling",
      "Documented multi-season crop history across 4 distinct crop cycles",
      "Crop rotation includes nitrogen-fixing leguminous species, lowering synthetic fertilizer demand"
    ],
    "gaps": [],
    "factors": [
      "Beneficial residue recycling (+25 pts)",
      "Conservation zero-tillage (+30 pts)",
      "Organic practice adoption (+15 pts)",
      "High-efficiency micro-irrigation (+35 pts)",
      "Verified soil analysis report on file (+25 pts)",
      "Nitrogen-fixing leguminous crop rotation (+15 pts)"
    ],
    "recommendations": [
      {
        "id": "rec-1",
        "category": "Irrigation",
        "priority": "MEDIUM",
        "message": "Implement structured water-usage logs and maintain pump operational records to substantiate irrigation efficiency claims during MRV audits.",
        "completed": false,
        "createdAt": "2026-10-05T10:10:00.000Z"
      }
    ],
    "disclaimer": "This assessment estimates preparedness based on the factors configured in our prototype assessment model and is not an official carbon-credit certification.",
    "createdAt": "2026-10-05T10:10:00.000Z"
  }
}
```

---

### 7. Get Assessment By ID
- **Endpoint**: `GET /api/assessments/:id`
- **Auth**: Required
- Returns full assessment result matching the format above.

---

### 8. Recalculate Assessment
- **Endpoint**: `POST /api/assessments/:id/recalculate`
- **Auth**: Required
- Creates a **brand new assessment entry** with the farm's latest evidence and practices, preserving the previous assessment unchanged.
- Returns `201 Created` with the new assessment object.

---

### 9. Get Farm Assessment History
- **Endpoint**: `GET /api/farms/:farmId/assessments`
- **Auth**: Required

#### Response (200 OK)
Returns array of assessments ordered chronologically (newest first) for charting progress (e.g., 23 → 55 → 74 → 88):
```json
{
  "success": true,
  "data": [
    {
      "id": "newest-assessment-id",
      "overallScore": 88,
      "readinessLevel": "HIGH_READINESS",
      "readinessLabel": "High Readiness",
      "createdAt": "2026-10-05T10:15:00.000Z",
      "categories": { ... }
    },
    {
      "id": "initial-assessment-id",
      "overallScore": 23,
      "readinessLevel": "NEEDS_IMPROVEMENT",
      "readinessLabel": "Needs Improvement",
      "createdAt": "2026-10-05T09:00:00.000Z",
      "categories": { ... }
    }
  ]
}
```

---

### 10. Upload Evidence Document
- **Endpoint**: `POST /api/documents/upload`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`

#### Form Fields
- `farmId` (string, UUID)
- `type` (string, enum: `LAND_DOCUMENT`, `SOIL_REPORT`, `CROP_RECORD`, `IRRIGATION_RECORD`, `FERTILIZER_RECORD`, `PRACTICE_PHOTO`, `OTHER`)
- `file` (binary, PDF / JPEG / PNG, max 10MB)

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "31b2649b-75c1-4c12-9c44-b05c56781234",
    "farmId": "2334f590-7d6f-40c9-940f-7b7c20c02fa2",
    "type": "SOIL_REPORT",
    "filename": "soil_carbon_test.pdf",
    "storageUrl": "/uploads/soil_carbon_test-172812345.pdf",
    "mimeType": "application/pdf",
    "fileSize": 450000,
    "status": "REVIEW_REQUIRED",
    "uploadedBy": "58135af6-eafa-40e3-ab76-c153d0a6bf2a",
    "createdAt": "2026-10-05T10:20:00.000Z",
    "updatedAt": "2026-10-05T10:20:00.000Z"
  }
}
```

---

### 11. Evidence Audit Summary
- **Endpoint**: `GET /api/documents/farm/:farmId/evidence-summary`
- **Auth**: Required

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalExpected": 5,
    "totalUploaded": 3,
    "verifiedCount": 2,
    "pendingCount": 1,
    "missingCount": 2,
    "rejectedCount": 0,
    "qualityScore": 45,
    "items": [
      {
        "documentType": "LAND_DOCUMENT",
        "label": "Land Title / Lease Agreement",
        "status": "VERIFIED",
        "filename": "satbara_7_12_deed.pdf"
      },
      {
        "documentType": "SOIL_REPORT",
        "label": "Soil Health & Carbon Test Report",
        "status": "PENDING_REVIEW",
        "filename": "soil_carbon_test.pdf"
      },
      {
        "documentType": "CROP_RECORD",
        "label": "Crop & Yield Records",
        "status": "VERIFIED",
        "filename": "mandi_receipt.pdf"
      },
      {
        "documentType": "IRRIGATION_RECORD",
        "label": "Irrigation & Water Management Logs",
        "status": "MISSING"
      },
      {
        "documentType": "FERTILIZER_RECORD",
        "label": "Fertilizer / Nutrient Input Records",
        "status": "MISSING"
      }
    ],
    "missingTypes": [
      "IRRIGATION_RECORD",
      "FERTILIZER_RECORD"
    ]
  }
}
```

---

### 12. Toggle Recommendation Action
- **Endpoint**: `PATCH /api/assessments/recommendations/:id/toggle`
- **Auth**: Required
- Toggles `completed` between `true` and `false`.
