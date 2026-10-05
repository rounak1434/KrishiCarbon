import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api";

async function verifyOrganicFertilizerE2E() {
  console.log("==================================================================");
  console.log("🌱 E2E Verification: Organic Fertilizer Management Flow");
  console.log("==================================================================");

  const timestamp = Date.now();
  const newEmail = `farmer.organic.${timestamp}@test.krishicarbon.io`;
  const password = "Password#2026";

  // Step 1: Register brand-new farmer
  console.log("\n[1] Registering fresh farmer:", newEmail);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: newEmail,
      password,
      role: "FARMER",
      name: "Sita Soren",
      phone: "9876501234",
      state: "Jharkhand",
      district: "Ranchi",
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.data.token;
  console.log("✅ Step 1: Farmer registered successfully. Token obtained.");

  // Step 2: Create Farm with Organic Fertilizer
  console.log("\n[2] Creating Farm with Organic Fertilizer (VERMICOMPOST)...");
  const farmRes = await fetch(`${API_BASE}/farms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Sita Organic Agro Parcel",
      areaAcres: 8.5,
      soilType: "Clay Loam",
      irrigationMethod: "Drip Micro-Irrigation",
      waterSource: "Harvested Rainwater Pond",
      fertilizerCategory: "ORGANIC",
      organicFertilizerType: "VERMICOMPOST",
      fertilizerUsage: "Vermicompost and bio-enrichment",
      pesticideUsage: "Neem Oil & Biopesticides",
      tillageMethod: "Reduced / Minimum Tillage",
      residueManagement: "In-situ Mulching",
      organicPractices: true,
    }),
  });

  const farmData = await farmRes.json();
  if (!farmRes.ok || !farmData.success) {
    throw new Error(`Farm creation failed: ${JSON.stringify(farmData)}`);
  }
  const farm = farmData.data;
  const farmId = farm.id;
  console.log("✅ Step 2: Farm created with ID:", farmId);
  console.log("   - Fertilizer Category in DB:", farm.fertilizerCategory);
  console.log("   - Organic Fertilizer Type in DB:", farm.organicFertilizerType);

  if (farm.fertilizerCategory !== "ORGANIC" || farm.organicFertilizerType !== "VERMICOMPOST") {
    throw new Error(`Farm fertilizer fields not persisted properly! Received: ${farm.fertilizerCategory}, ${farm.organicFertilizerType}`);
  }

  // Step 3: Run Assessment on the Organic Farm
  console.log("\n[3] Running Assessment on the Organic Farm...");
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
  const assessment1 = assessData.data;
  console.log(`✅ Step 3: Assessment 1 completed. Score: ${assessment1.overallScore}/100 (${assessment1.readinessLevel})`);
  console.log("   - Practices Score:", assessment1.categories?.farmingPractices);
  console.log("   - Soil Management Score:", assessment1.categories?.soilManagement);
  console.log("   - Strengths:", assessment1.strengths);

  // Verify explainability
  const hasOrganicStrength = assessment1.strengths.some((s: string) =>
    s.toLowerCase().includes("organic nutrient") || s.toLowerCase().includes("vermicompost")
  );
  console.log("   - Contains Organic Nutrient Strength:", hasOrganicStrength);
  if (!hasOrganicStrength) {
    throw new Error("Assessment strengths missing organic fertilizer explainability!");
  }

  // Verify recommendations do NOT ask an already-organic farmer to switch to organic
  const recommendsOrganicTransition = assessment1.recommendations.some((r: any) =>
    (r.message || "").toLowerCase().includes("organic nutrient sources such as compost")
  );
  console.log("   - Recommends Redundant Organic Switch:", recommendsOrganicTransition);
  if (recommendsOrganicTransition) {
    throw new Error("Incorrectly recommended switching to organic when farmer is already organic!");
  }

  // Step 4: Change fertilizer practice to SYNTHETIC
  console.log("\n[4] Updating Farm fertilizer practice to SYNTHETIC (Chemical NPK)...");
  const updateRes = await fetch(`${API_BASE}/farms/${farmId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fertilizerCategory: "SYNTHETIC",
      organicFertilizerType: null,
      fertilizerUsage: "Heavy Synthetic Urea & NPK",
    }),
  });

  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    throw new Error(`Farm update failed: ${JSON.stringify(updateData)}`);
  }
  console.log("✅ Step 4: Farm updated. New fertilizerCategory:", updateData.data.fertilizerCategory);
  if (updateData.data.fertilizerCategory !== "SYNTHETIC") {
    throw new Error(`Updated category mismatch: ${updateData.data.fertilizerCategory}`);
  }

  // Step 5: Recalculate Assessment
  console.log("\n[5] Recalculating Assessment after shifting to SYNTHETIC...");
  const recalcRes = await fetch(`${API_BASE}/assessments/${assessment1.id}/recalculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const recalcData = await recalcRes.json();
  if (!recalcRes.ok || !recalcData.success) {
    throw new Error(`Recalculation failed: ${JSON.stringify(recalcData)}`);
  }
  const assessment2 = recalcData.data;
  console.log(`✅ Step 5: Recalculated Assessment 2 completed. Score: ${assessment2.overallScore}/100 (${assessment2.readinessLevel})`);
  console.log("   - Score Delta:", assessment2.overallScore - assessment1.overallScore, "points");
  console.log("   - Gaps:", assessment2.gaps);

  // Verify explainability reflects synthetic gap
  const hasSyntheticGap = assessment2.gaps.some((g: string) =>
    g.toLowerCase().includes("synthetic")
  );
  console.log("   - Contains Synthetic Fertilizer Gap:", hasSyntheticGap);
  if (!hasSyntheticGap) {
    throw new Error("Recalculated assessment missing synthetic fertilizer gap explainability!");
  }

  // Verify recommendation now advises transitioning / adopting organic nutrient sources
  const nowRecommendsOrganic = assessment2.recommendations.some((r: any) =>
    (r.message || "").toLowerCase().includes("organic nutrient sources such as compost")
  );
  console.log("   - Now Dynamically Recommends Organic Nutrients:", nowRecommendsOrganic);
  if (!nowRecommendsOrganic) {
    throw new Error("Recalculated assessment should recommend organic nutrient sources for synthetic farmer!");
  }

  // Step 6: Verify Assessment History Timeline
  console.log("\n[6] Fetching Assessment History for Farm...");
  const historyRes = await fetch(`${API_BASE}/farms/${farmId}/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const historyData = await historyRes.json();
  if (!historyRes.ok || !historyData.success) {
    throw new Error(`History fetch failed: ${JSON.stringify(historyData)}`);
  }

  console.log(`✅ Step 6: Found ${historyData.data.length} historical assessment records.`);
  if (historyData.data.length < 2) {
    throw new Error(`Expected at least 2 assessments in history, got ${historyData.data.length}`);
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL REAL END-TO-END CRITERIA VERIFIED SUCCESSFULLY!");
  console.log("==================================================================");
}

verifyOrganicFertilizerE2E().catch((err) => {
  console.error("❌ E2E Verification Failed:", err);
  process.exit(1);
});
