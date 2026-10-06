/**
 * Live API Verification Script
 * Tests all required endpoints against the running server at http://localhost:5000
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

async function runVerification() {
  console.log(`\n======================================================`);
  console.log(`🔍 FarmerChoice Live API Production Verification: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results: Array<{ endpoint: string; method: string; status: number; passed: boolean; note?: string }> = [];

  // 1. GET /health
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const body = await res.json();
    const passed = res.status === 200 && body.status === "ok";
    results.push({ endpoint: "/health", method: "GET", status: res.status, passed, note: `service: ${body.service}` });
  } catch (e) {
    results.push({ endpoint: "/health", method: "GET", status: 0, passed: false, note: String(e) });
  }

  // 2. GET /ready
  try {
    const res = await fetch(`${BASE_URL}/ready`);
    const body = await res.json();
    const passed = res.status === 200 && body.database === "connected";
    results.push({ endpoint: "/ready", method: "GET", status: res.status, passed, note: `db: ${body.database}` });
  } catch (e) {
    results.push({ endpoint: "/ready", method: "GET", status: 0, passed: false, note: String(e) });
  }

  // 3. POST /api/auth/login
  let token = "";
  let userId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "farmer.lakshmi@agricred.demo", password: "AgriCred#2026" }),
    });
    const body = await res.json();
    token = body.data?.token || "";
    userId = body.data?.user?.id || "";
    const passed = res.status === 200 && token.length > 0;
    results.push({ endpoint: "/api/auth/login", method: "POST", status: res.status, passed, note: `token obtained` });
  } catch (e) {
    results.push({ endpoint: "/api/auth/login", method: "POST", status: 0, passed: false, note: String(e) });
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 4. GET /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    const body = await res.json();
    const passed = res.status === 200 && body.data?.email === "farmer.lakshmi@agricred.demo" && !body.data?.passwordHash;
    results.push({ endpoint: "/api/auth/me", method: "GET", status: res.status, passed, note: `user: ${body.data?.farmer?.name}` });
  } catch (e) {
    results.push({ endpoint: "/api/auth/me", method: "GET", status: 0, passed: false, note: String(e) });
  }

  // 5. GET /api/farms
  let farmId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/farms`, { headers: authHeaders });
    const body = await res.json();
    farmId = body.data?.[0]?.id || "";
    const passed = res.status === 200 && Array.isArray(body.data) && body.data.length > 0;
    results.push({ endpoint: "/api/farms", method: "GET", status: res.status, passed, note: `farms count: ${body.data?.length}` });
  } catch (e) {
    results.push({ endpoint: "/api/farms", method: "GET", status: 0, passed: false, note: String(e) });
  }

  // 6. POST /api/farms
  let newFarmId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/farms`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Live Audit Farm ${Date.now()}`,
        areaAcres: 12.5,
        soilType: "Clay Loam",
        irrigationMethod: "Drip Irrigation",
        waterSource: "Rainwater Pond",
        fertilizerUsage: "Biofertilizers",
        pesticideUsage: "IPM",
        tillageMethod: "Zero Tillage",
        residueManagement: "In-situ Mulching",
        organicPractices: true,
      }),
    });
    const body = await res.json();
    newFarmId = body.data?.id || "";
    const passed = res.status === 201 && newFarmId.length > 0;
    results.push({ endpoint: "/api/farms", method: "POST", status: res.status, passed, note: `created farm ${newFarmId}` });
  } catch (e) {
    results.push({ endpoint: "/api/farms", method: "POST", status: 0, passed: false, note: String(e) });
  }

  const targetFarmId = newFarmId || farmId;

  // 7. POST /api/crops
  try {
    const res = await fetch(`${BASE_URL}/api/crops`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        farmId: targetFarmId,
        crop: "Soybean",
        season: "Kharif",
        year: 2024,
        yield: 2.8,
      }),
    });
    const body = await res.json();
    const passed = res.status === 201 && body.data?.crop === "Soybean";
    results.push({ endpoint: "/api/crops", method: "POST", status: res.status, passed, note: `added crop ${body.data?.id}` });
  } catch (e) {
    results.push({ endpoint: "/api/crops", method: "POST", status: 0, passed: false, note: String(e) });
  }

  // 8. POST /api/documents/upload
  try {
    const formData = new FormData();
    formData.append("farmId", targetFarmId);
    formData.append("type", "LAND_DOCUMENT");
    formData.append(
      "file",
      new Blob(["%PDF-1.4 Simulated land title document for carbon credit readiness audit"], {
        type: "application/pdf",
      }),
      "verified_land_deed.pdf"
    );

    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    const body = await res.json();
    const passed = res.status === 201 && body.data?.filename?.includes("verified_land_deed");
    results.push({ endpoint: "/api/documents/upload", method: "POST", status: res.status, passed, note: `uploaded doc ${body.data?.id} (status: ${body.data?.status})` });
  } catch (e) {
    results.push({ endpoint: "/api/documents/upload", method: "POST", status: 0, passed: false, note: String(e) });
  }

  // 9. POST /api/assessments
  let assessmentId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/assessments`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ farmId: targetFarmId }),
    });
    const body = await res.json();
    assessmentId = body.data?.id || "";
    const score = body.data?.overallScore;
    const passed = res.status === 201 && assessmentId.length > 0 && typeof score === "number";
    results.push({ endpoint: "/api/assessments", method: "POST", status: res.status, passed, note: `score: ${score}, level: ${body.data?.readinessLevel}` });
  } catch (e) {
    results.push({ endpoint: "/api/assessments", method: "POST", status: 0, passed: false, note: String(e) });
  }

  // 10. GET /api/assessments/:id
  try {
    const res = await fetch(`${BASE_URL}/api/assessments/${assessmentId}`, { headers: authHeaders });
    const body = await res.json();
    const passed = res.status === 200 && body.data?.id === assessmentId && body.data?.categories?.farmingPractices !== undefined;
    results.push({ endpoint: "/api/assessments/:id", method: "GET", status: res.status, passed, note: `retrieved assessment details` });
  } catch (e) {
    results.push({ endpoint: "/api/assessments/:id", method: "GET", status: 0, passed: false, note: String(e) });
  }

  // 11. POST /api/assessments/:id/recalculate
  let newAssessmentId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/assessments/${assessmentId}/recalculate`, {
      method: "POST",
      headers: authHeaders,
    });
    const body = await res.json();
    newAssessmentId = body.data?.id || "";
    const passed = res.status === 201 && newAssessmentId.length > 0 && newAssessmentId !== assessmentId;
    results.push({ endpoint: "/api/assessments/:id/recalculate", method: "POST", status: res.status, passed, note: `new version created: ${newAssessmentId}` });
  } catch (e) {
    results.push({ endpoint: "/api/assessments/:id/recalculate", method: "POST", status: 0, passed: false, note: String(e) });
  }

  // 12. GET /api/farms/:farmId/assessments
  try {
    const res = await fetch(`${BASE_URL}/api/farms/${targetFarmId}/assessments`, { headers: authHeaders });
    const body = await res.json();
    const passed = res.status === 200 && Array.isArray(body.data) && body.data.length >= 2;
    results.push({ endpoint: "/api/farms/:farmId/assessments", method: "GET", status: res.status, passed, note: `history versions count: ${body.data?.length}` });
  } catch (e) {
    results.push({ endpoint: "/api/farms/:farmId/assessments", method: "GET", status: 0, passed: false, note: String(e) });
  }

  console.log("\n📊 Verification Results:");
  console.log("----------------------------------------------------------------------");
  let allPassed = true;
  for (const r of results) {
    const statusIcon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${statusIcon} | ${r.method.padEnd(5)} | ${r.endpoint.padEnd(35)} | Status: ${r.status} | ${r.note || ""}`);
    if (!r.passed) allPassed = false;
  }
  console.log("----------------------------------------------------------------------");

  if (allPassed) {
    console.log("🎉 ALL 12 LIVE ENDPOINTS VERIFIED SUCCESSFULLY AGAINST RUNNING SERVER!\n");
    process.exit(0);
  } else {
    console.error("💥 SOME LIVE CHECKS FAILED!\n");
    process.exit(1);
  }
}

runVerification();
