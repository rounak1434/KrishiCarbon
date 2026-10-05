#!/usr/bin/env node

/**
 * KrishiCarbon — Production Smoke Test Suite
 *
 * Usage:
 *   PRODUCTION_API_URL=https://krishicarbon-backend.onrender.com/api node scripts/production-smoke-test.mjs
 *   or:
 *   node scripts/production-smoke-test.mjs (defaults to http://localhost:5000/api)
 */

const API_BASE = (process.env.PRODUCTION_API_URL || process.env.API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const ROOT_BASE = API_BASE.replace(/\/api$/, "");

console.log("==================================================================");
console.log("🚀 KrishiCarbon Production Smoke Test Suite");
console.log(`📡 Target API Endpoint:  ${API_BASE}`);
console.log(`🏥 Health Check Base:    ${ROOT_BASE}`);
console.log("==================================================================\n");

let passedCount = 0;
let failedCount = 0;

function report(step, name, success, details = "") {
  if (success) {
    passedCount++;
    console.log(`  ✓ [STEP ${step}] ${name} ${details ? `(${details})` : ""}`);
  } else {
    failedCount++;
    console.error(`  ✗ [STEP ${step}] FAILED: ${name} ${details ? `-> ${details}` : ""}`);
  }
}

async function run() {
  const timestamp = Date.now();
  const testEmail = `smoketest.${timestamp}@krishicarbon.test`;
  const password = "SmokePassword#2026";
  let token = null;
  let farmId = null;
  let assessmentId = null;
  let docId = null;

  try {
    // 1. Health Check
    console.log("1. Checking Application Health & Database Readiness...");
    const healthRes = await fetch(`${ROOT_BASE}/health`);
    const healthData = await healthRes.json();
    report(1, "GET /health responds with 200 OK", healthRes.ok && healthData.status === "ok", `service: ${healthData.service}`);

    // 2. Database Readiness Check
    const readyRes = await fetch(`${ROOT_BASE}/ready`);
    const readyData = await readyRes.json();
    report(2, "GET /ready verifies PostgreSQL connection", readyRes.ok && readyData.database === "connected");

    // 3. Register Unique Test Farmer
    console.log("\n2. Testing Authentication & Session Lifecycle...");
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password,
        role: "FARMER",
        name: "Smoke Test Farmer",
        phone: "9123456780",
        state: "Jharkhand",
        district: "Ranchi",
      }),
    });
    const regData = await regRes.json();
    token = regData?.data?.token;
    report(3, "POST /api/auth/register creates isolated farmer", regRes.ok && regData.success && !!token);

    // 4. Verify Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password }),
    });
    const loginData = await loginRes.json();
    if (loginData?.data?.token) token = loginData.data.token;
    report(4, "POST /api/auth/login validates credentials and issues JWT", loginRes.ok && loginData.success);

    // 5. Create Farm with Organic Fertilizer
    console.log("\n3. Testing Farm & Crop Creation...");
    const farmRes = await fetch(`${API_BASE}/farms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Smoke Test Agro Parcel ${timestamp}`,
        areaAcres: 10.0,
        soilType: "Loamy Sand",
        irrigationMethod: "Drip Micro-Irrigation",
        waterSource: "Rainwater Harvesting Pond",
        fertilizerCategory: "ORGANIC",
        organicFertilizerType: "VERMICOMPOST",
        fertilizerUsage: "Vermicompost & biofertilizers",
        pesticideUsage: "Bio-pesticides",
        tillageMethod: "Zero Tillage",
        residueManagement: "In-situ Mulching",
        organicPractices: true,
      }),
    });
    const farmData = await farmRes.json();
    farmId = farmData?.data?.id;
    report(5, "POST /api/farms persists farm parcel with organic fertilizer", farmRes.ok && farmData.success && !!farmId, `Category: ${farmData?.data?.fertilizerCategory}`);

    // 6. Add Crop Record
    const cropRes = await fetch(`${API_BASE}/crops`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        farmId,
        crop: "Finger Millet (Ragi)",
        season: "Kharif",
        year: 2024,
        yield: 2.4,
      }),
    });
    const cropData = await cropRes.json();
    report(6, "POST /api/crops adds multi-season crop record", cropRes.ok && cropData.success);

    // 7. Run Initial Readiness Assessment
    console.log("\n4. Testing Assessment Engine & Explainability...");
    const assessRes = await fetch(`${API_BASE}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ farmId }),
    });
    const assessData = await assessRes.json();
    assessmentId = assessData?.data?.id;
    const initialScore = assessData?.data?.overallScore;
    report(7, "POST /api/assessments generates deterministic score & explainability", assessRes.ok && assessData.success && typeof initialScore === "number", `Score: ${initialScore}/100, Version: ${assessData?.data?.engineVersion}`);

    // 8. Upload Document to Storage Provider
    console.log("\n5. Testing Document Storage Abstraction...");
    const dummyPdfContent = "%PDF-1.4\n%KrishiCarbon Smoke Test Evidence\n%%EOF";
    const formData = new FormData();
    formData.append("farmId", farmId);
    formData.append("type", "SOIL_REPORT");
    formData.append("file", new Blob([dummyPdfContent], { type: "application/pdf" }), "soil_report_smoke.pdf");

    const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    docId = uploadData?.data?.id;
    const storageUrl = uploadData?.data?.storageUrl;
    report(8, "POST /api/documents/upload persists document to storage", uploadRes.ok && uploadData.success && !!docId, `URL: ${storageUrl?.substring(0, 45)}...`);

    // 9. Update Farm Practices (e.g. Synthetic)
    console.log("\n6. Testing Recalculation Flow & History...");
    const updateRes = await fetch(`${API_BASE}/farms/${farmId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fertilizerCategory: "SYNTHETIC",
        fertilizerUsage: "Chemical NPK and Urea",
      }),
    });
    const updateData = await updateRes.json();
    report(9, "PUT /api/farms/:id updates farm practices in database", updateRes.ok && updateData.success);

    // 10. Recalculate Assessment
    const recalcRes = await fetch(`${API_BASE}/assessments/${assessmentId}/recalculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const recalcData = await recalcRes.json();
    const newScore = recalcData?.data?.overallScore;
    report(10, "POST /api/assessments/:id/recalculate creates new assessment version", recalcRes.ok && recalcData.success, `New Score: ${newScore}/100`);

    // 11. Retrieve Assessment History
    const historyRes = await fetch(`${API_BASE}/farms/${farmId}/assessments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const historyData = await historyRes.json();
    report(11, "GET /api/farms/:farmId/assessments returns versioned history", historyRes.ok && Array.isArray(historyData?.data) && historyData.data.length >= 2, `${historyData?.data?.length} versions`);

    // 12. Verify Profile and Data Persistence
    console.log("\n7. Verifying Persistence Across Sessions...");
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    report(12, "GET /api/auth/me returns persisted profile and farms", meRes.ok && meData?.data?.farmer?.farms?.length > 0);

    // 13. Safe Cleanup of Smoke Test Data
    console.log("\n8. Cleaning Up Smoke Test Artifacts...");
    let cleanupSuccess = true;
    if (docId) {
      const delDocRes = await fetch(`${API_BASE}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!delDocRes.ok) cleanupSuccess = false;
    }
    if (farmId) {
      const delFarmRes = await fetch(`${API_BASE}/farms/${farmId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!delFarmRes.ok) cleanupSuccess = false;
    }
    report(13, "Safe cleanup: Deleted smoke test document and farm parcel", cleanupSuccess);

  } catch (err) {
    report(99, "Execution halted due to unexpected error", false, err.message);
  }

  // Summary
  console.log("\n==================================================================");
  if (failedCount === 0) {
    console.log(`🎉 PRODUCTION SMOKE TEST PASSED! (${passedCount}/${passedCount} checks successful)`);
  } else {
    console.error(`❌ PRODUCTION SMOKE TEST FAILED: ${failedCount} failures out of ${passedCount + failedCount} checks.`);
  }
  console.log("==================================================================\n");

  process.exit(failedCount === 0 ? 0 : 1);
}

run();
