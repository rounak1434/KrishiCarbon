import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api";

async function runTest() {
  console.log("==================================================================");
  console.log("🚜 Testing AgriCred Full Flow with Brand-New Non-Seeded Farmer");
  console.log("==================================================================");

  const timestamp = Date.now();
  const newEmail = `farmer.fresh.${timestamp}@test.agricred.io`;
  const password = "Password#2026";

  // 1. Register brand-new farmer
  console.log("\n1. Registering new farmer:", newEmail);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: newEmail,
      password,
      role: "FARMER",
      name: "Ramesh Chandra Patel",
      phone: "9876543210",
      state: "Jharkhand",
      district: "Ranchi",
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  console.log("✅ Registration Successful. Token received.");
  let token = regData.data.token;

  // 2. Login verification
  console.log("\n2. Logging in with credentials...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  token = loginData.data.token;
  console.log("✅ Login Successful for:", loginData.data.user.farmer.name);

  // 3. Create a farm
  console.log("\n3. Creating initial farm parcel with baseline practices...");
  const farmRes = await fetch(`${API_BASE}/farms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Birsa Munda Krishi Farm",
      areaAcres: 12.5,
      soilType: "Alluvial Loam",
      irrigationMethod: "Flood Irrigation",
      waterSource: "Groundwater Tube Well",
      fertilizerUsage: "Balanced Chemical NPK",
      pesticideUsage: "Minimal Targeted Application",
      tillageMethod: "Conventional Deep Plowing",
      residueManagement: "Stubble Burning",
      organicPractices: false,
    }),
  });

  const farmData = await farmRes.json();
  if (!farmRes.ok || !farmData.success) {
    throw new Error(`Farm creation failed: ${JSON.stringify(farmData)}`);
  }
  const farmId = farmData.data.id;
  console.log("✅ Farm Created with ID:", farmId);

  // 4. Add crop history
  console.log("\n4. Adding seasonal crop history...");
  const cropRes = await fetch(`${API_BASE}/crops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      farmId,
      crop: "Paddy (Kharif)",
      season: "Kharif",
      year: 2024,
      yield: 3.2,
    }),
  });
  const cropData = await cropRes.json();
  if (!cropRes.ok || !cropData.success) {
    throw new Error(`Crop creation failed: ${JSON.stringify(cropData)}`);
  }
  console.log("✅ Crop Record Added:", cropData.data.crop);

  // 5. Run initial assessment
  console.log("\n5. Running initial Readiness Assessment...");
  const assessRes = await fetch(`${API_BASE}/assessments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ farmId }),
  });
  const assessData = await assessRes.json();
  if (!assessRes.ok || !assessData.success) {
    throw new Error(`Assessment failed: ${JSON.stringify(assessData)}`);
  }
  const initialScore = assessData.data.overallScore;
  const initialLevel = assessData.data.readinessLevel;
  const initialId = assessData.data.id;
  console.log(`✅ Initial Score Calculated Server-Side: ${initialScore} / 100 (${initialLevel})`);
  console.log(`   Strengths (${assessData.data.strengths.length}):`, assessData.data.strengths.slice(0, 2));
  console.log(`   Gaps (${assessData.data.gaps.length}):`, assessData.data.gaps.slice(0, 2));
  console.log(`   Recommendations (${assessData.data.recommendations.length}):`, assessData.data.recommendations.map((r: any) => r.category));

  // 6. Upload a test document
  console.log("\n6. Uploading test evidence document (Soil Report)...");
  const tempFile = path.resolve("./uploads/temp_test_doc.pdf");
  fs.writeFileSync(tempFile, "%PDF-1.4 mock content for live verification");

  const formData = new FormData();
  formData.append("farmId", farmId);
  formData.append("type", "SOIL_REPORT");
  const fileBlob = new Blob([fs.readFileSync(tempFile)], { type: "application/pdf" });
  formData.append("file", fileBlob, "soil_report_ranchi.pdf");

  const docRes = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const docData = await docRes.json();
  if (!docRes.ok || !docData.success) {
    throw new Error(`Doc upload failed: ${JSON.stringify(docData)}`);
  }
  console.log("✅ Document Uploaded Successfully:", docData.data.filename, `(Status: ${docData.data.status})`);

  // 7. Update farm practices (Flood -> Drip, Burning -> Mulching, Zero-Till)
  console.log("\n7. Updating farm practices to sustainable alternatives (Drip, Mulching, Zero-Till)...");
  const updateRes = await fetch(`${API_BASE}/farms/${farmId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      irrigationMethod: "Drip Micro-Irrigation",
      tillageMethod: "Zero Tillage / No-Till",
      residueManagement: "In-situ Mulching with Happy Seeder",
      fertilizerUsage: "Biofertilizers & Vermicompost",
      organicPractices: true,
    }),
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    throw new Error(`Farm update failed: ${JSON.stringify(updateData)}`);
  }
  console.log("✅ Farm Practices Updated in PostgreSQL.");

  // 8. Recalculate assessment
  console.log("\n8. Recalculating assessment with upgraded practices...");
  const recalcRes = await fetch(`${API_BASE}/assessments/${initialId}/recalculate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const recalcData = await recalcRes.json();
  if (!recalcRes.ok || !recalcData.success) {
    throw new Error(`Recalculate failed: ${JSON.stringify(recalcData)}`);
  }
  const newScore = recalcData.data.overallScore;
  const newLevel = recalcData.data.readinessLevel;
  console.log(`✅ Recalculated Assessment Score: ${newScore} / 100 (${newLevel})`);
  console.log(`   Score Elevation: ${initialScore} ➔ ${newScore} (+${newScore - initialScore} pts!)`);

  // 9. Verify assessment history timeline
  console.log("\n9. Verifying chronological assessment history...");
  const histRes = await fetch(`${API_BASE}/farms/${farmId}/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const histData = await histRes.json();
  if (!histRes.ok || !histData.success) {
    throw new Error(`History fetch failed: ${JSON.stringify(histData)}`);
  }
  console.log(`✅ Assessment History Contains ${histData.data.length} Versions:`, histData.data.map((h: any) => `Score ${h.overallScore}`));

  // 10. Re-login and check persistence
  console.log("\n10. Testing session re-authentication and data persistence...");
  const reLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail, password }),
  });
  const reLoginData = await reLoginRes.json();
  const reToken = reLoginData.data.token;

  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${reToken}` },
  });
  const meData = await meRes.json();
  console.log("✅ Persisted Profile Retrieved:", meData.data.farmer.name, "with", meData.data.farmer.farms.length, "farms.");

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED! FULL END-TO-END FLOW VERIFIED WITH FRESH USER!");
  console.log("==================================================================");
}

runTest().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
