// ===== FarmerChoice Direct HTTP Integration Verification =====

import fs from 'fs';
import path from 'path';

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ROOT_BASE = 'http://localhost:5000';

const timestamp = Date.now();
const testUser = {
  name: `Ramesh Verma ${timestamp}`,
  phone: `+91 99${String(timestamp).slice(-8)}`,
  email: `farmer.ramesh.${timestamp}@farmerchoice.test`,
  password: 'FarmerChoice#2026',
  state: 'Jharkhand',
  district: 'Ranchi',
};

let token = '';
let userId = '';
let farmerId = '';
let farmId = '';
let cropId = '';
let initialAssessmentId = '';
let recalculatedAssessmentId = '';
let uploadedDocId = '';

let initialScore = 0;
let recalculatedScore = 0;

function logStep(step, message) {
  console.log(`\n🔹 [STEP ${step}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log('===============================================================');
  console.log('🚀 FarmerChoice Backend Integration Verification (Direct HTTP)');
  console.log(`Target API Base: ${API_BASE}`);
  console.log('===============================================================');

  // 1. Health & Readiness
  logStep(1, 'Verifying Health and Readiness Endpoints');
  const healthRes = await fetch(`${ROOT_BASE}/health`);
  assert(healthRes.ok, `GET /health returned HTTP ${healthRes.status}`);
  const healthData = await healthRes.json();
  assert(healthData.status === 'ok', 'GET /health status is ok');

  const readyRes = await fetch(`${ROOT_BASE}/ready`);
  assert(readyRes.ok, `GET /ready returned HTTP ${readyRes.status}`);
  const readyData = await readyRes.json();
  assert(readyData.status === 'ready', 'GET /ready status is ready (PostgreSQL connected)');

  // 2. Register brand new farmer
  logStep(2, `Registering Brand New Test Farmer: ${testUser.email}`);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  assert(regRes.status === 201, `POST /api/auth/register returned HTTP 201 (got ${regRes.status})`);
  const regJson = await regRes.json();
  assert(regJson.success === true, 'Registration succeeded with envelope success: true');
  assert(Boolean(regJson.data.token), 'Registration returned JWT token');
  token = regJson.data.token;
  userId = regJson.data.user.id;
  farmerId = regJson.data.user.farmer.id;
  console.log(`  User ID: ${userId}, Farmer ID: ${farmerId}`);

  // 3. Login with newly created credentials
  logStep(3, 'Logging in with New Farmer Credentials');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  assert(loginRes.ok, `POST /api/auth/login returned HTTP ${loginRes.status}`);
  const loginJson = await loginRes.json();
  assert(loginJson.success === true, 'Login response success is true');
  token = loginJson.data.token;
  assert(Boolean(token), 'Received new JWT token on login');

  // 4. Verify Empty State for Fresh Farmer
  logStep(4, 'Verifying Empty State for Fresh Farmer (No farms, crops, assessments)');
  const emptyFarmsRes = await fetch(`${API_BASE}/farms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(emptyFarmsRes.ok, 'GET /api/farms succeeded');
  const emptyFarmsJson = await emptyFarmsRes.json();
  assert(Array.isArray(emptyFarmsJson.data) && emptyFarmsJson.data.length === 0, 'Fresh farmer has exactly 0 farms (clean empty state)');

  // 5. Get current profile (GET /api/auth/me)
  logStep(5, 'Fetching Authenticated Profile via GET /api/auth/me');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(meRes.ok, `GET /api/auth/me returned HTTP ${meRes.status}`);
  const meJson = await meRes.json();
  assert(meJson.data.email === testUser.email, 'GET /api/auth/me returns matching email');
  assert(meJson.data.farmer.name === testUser.name, 'GET /api/auth/me returns matching farmer name');
  assert(meJson.data.farmer.state === testUser.state, 'GET /api/auth/me returns matching state');

  // 6. Create farm with initial basic/poor practices to test scoring sensitivity
  logStep(6, 'Creating Farm with Initial Conventional Practices via POST /api/farms');
  const initialFarmPayload = {
    name: 'Verma Transitional Farm',
    areaAcres: 8.5,
    soilType: 'Clay Loam Soil',
    irrigationMethod: 'Flood Irrigation',
    waterSource: 'Groundwater Borewell',
    fertilizerCategory: 'SYNTHETIC',
    fertilizerUsage: 'High Chemical NPK Application',
    pesticideUsage: 'Periodic Chemical Sprays',
    tillageMethod: 'Conventional Deep Ploughing',
    residueManagement: 'Field Burning / Stubble Burning',
    organicPractices: false,
  };

  const createFarmRes = await fetch(`${API_BASE}/farms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(initialFarmPayload),
  });
  assert(createFarmRes.status === 201, `POST /api/farms returned HTTP 201 (got ${createFarmRes.status})`);
  const farmJson = await createFarmRes.json();
  farmId = farmJson.data.id;
  assert(Boolean(farmId), `Farm created with ID: ${farmId}`);
  assert(farmJson.data.fertilizerCategory === 'SYNTHETIC', 'Farm persisted with fertilizerCategory: SYNTHETIC');

  // Fetch created farm by ID
  const getFarmRes = await fetch(`${API_BASE}/farms/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(getFarmRes.ok, `GET /api/farms/:id returned HTTP ${getFarmRes.status}`);

  // 7. Add Crop History
  logStep(7, 'Adding Crop History via POST /api/crops');
  const cropPayload = {
    farmId,
    crop: 'Paddy (Rice)',
    season: 'Kharif',
    year: 2024,
    yield: 2.1,
  };
  const cropRes = await fetch(`${API_BASE}/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cropPayload),
  });
  assert(cropRes.status === 201, `POST /api/crops returned HTTP 201 (got ${cropRes.status})`);
  const cropJson = await cropRes.json();
  cropId = cropJson.data.id;
  assert(Boolean(cropId), `Crop record created with ID: ${cropId}`);

  // Also add a second crop (legume rotation)
  await fetch(`${API_BASE}/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      farmId,
      crop: 'Chickpea / Pulses',
      season: 'Rabi',
      year: 2024,
      yield: 1.4,
    }),
  });

  // Verify GET /api/crops/farm/:farmId
  const farmCropsRes = await fetch(`${API_BASE}/farms/${farmId}/crops`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(farmCropsRes.ok, 'GET /api/farms/:farmId/crops returned HTTP 200');
  const farmCropsJson = await farmCropsRes.json();
  assert(farmCropsJson.data.length === 2, 'Farm now has 2 crops persisted in PostgreSQL');

  // 8. Run Assessment 1 (Server-Side Deterministic Calculation)
  logStep(8, 'Executing Assessment 1 via POST /api/assessments');
  const assessRes = await fetch(`${API_BASE}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ farmId }),
  });
  assert(assessRes.status === 201, `POST /api/assessments returned HTTP 201 (got ${assessRes.status})`);
  const assessJson = await assessRes.json();
  initialAssessmentId = assessJson.data.id;
  initialScore = assessJson.data.overallScore;
  assert(typeof initialScore === 'number', `Server calculated overallScore: ${initialScore}`);
  assert(Boolean(assessJson.data.readinessLevel), `Readiness level: ${assessJson.data.readinessLevel}`);
  assert(Boolean(assessJson.data.categories), 'Category breakdown returned by backend');
  assert(Array.isArray(assessJson.data.strengths), 'Strengths array returned by backend');
  assert(Array.isArray(assessJson.data.gaps), 'Gaps array returned by backend');
  assert(Array.isArray(assessJson.data.recommendations), 'Recommendations returned by backend');
  console.log(`  Initial Assessment Score (Conventional Practices): ${initialScore} / 100 (${assessJson.data.readinessLevel})`);

  // Verify GET /api/assessments/:id
  const getAssessRes = await fetch(`${API_BASE}/assessments/${initialAssessmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(getAssessRes.ok, 'GET /api/assessments/:id returned full assessment record');

  // 9. Upload Evidence Document
  logStep(9, 'Uploading Real PDF Evidence via POST /api/documents/upload');
  const testPdfPath = path.resolve('test-soil-report.pdf');
  const pdfBytes = fs.readFileSync(testPdfPath);
  const formData = new FormData();
  formData.append('farmId', farmId);
  formData.append('type', 'SOIL_REPORT');
  formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'icar_soil_carbon_test.pdf');

  const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  assert(uploadRes.status === 201, `POST /api/documents/upload returned HTTP 201 (got ${uploadRes.status})`);
  const uploadJson = await uploadRes.json();
  uploadedDocId = uploadJson.data.id;
  assert(uploadJson.data.status === 'REVIEW_REQUIRED', 'Uploaded document status is REVIEW_REQUIRED (auditor verification required)');
  console.log(`  Document Uploaded with ID: ${uploadedDocId}, Status: ${uploadJson.data.status}`);

  // Verify GET /api/documents/farm/:farmId/evidence-summary
  const evSumRes = await fetch(`${API_BASE}/documents/farm/${farmId}/evidence-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(evSumRes.ok, 'GET /api/documents/farm/:farmId/evidence-summary returned HTTP 200');
  const evSumJson = await evSumRes.json();
  assert(evSumJson.data.totalUploaded >= 1, 'Evidence summary reflects 1 uploaded document');

  // 10. Update Farm to Sustainable Regenerative Practices
  logStep(10, 'Updating Farm Practices to Regenerative Practices via PUT /api/farms/:id');
  const improvedFarmPayload = {
    irrigationMethod: 'Drip Micro-Irrigation',
    waterSource: 'Rainwater Harvesting Farm Pond',
    fertilizerCategory: 'ORGANIC',
    organicFertilizerType: 'VERMICOMPOST',
    fertilizerUsage: 'ORGANIC (VERMICOMPOST)',
    pesticideUsage: 'Integrated Pest Management (Neem Oil)',
    tillageMethod: 'Zero Tillage / No-Till',
    residueManagement: 'In-situ Residue Mulching with Happy Seeder',
    organicPractices: true,
  };

  const updateFarmRes = await fetch(`${API_BASE}/farms/${farmId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(improvedFarmPayload),
  });
  assert(updateFarmRes.ok, `PUT /api/farms/:id returned HTTP ${updateFarmRes.status}`);
  const updateFarmJson = await updateFarmRes.json();
  assert(updateFarmJson.data.fertilizerCategory === 'ORGANIC', 'Farm practice updated to fertilizerCategory: ORGANIC');
  assert(updateFarmJson.data.organicFertilizerType === 'VERMICOMPOST', 'Farm practice updated to organicFertilizerType: VERMICOMPOST');

  // 11. Recalculate Assessment
  logStep(11, 'Recalculating Assessment via POST /api/assessments/:id/recalculate');
  const recalcRes = await fetch(`${API_BASE}/assessments/${initialAssessmentId}/recalculate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(recalcRes.status === 201, `POST /api/assessments/:id/recalculate returned HTTP 201 (got ${recalcRes.status})`);
  const recalcJson = await recalcRes.json();
  recalculatedAssessmentId = recalcJson.data.id;
  recalculatedScore = recalcJson.data.overallScore;
  assert(recalculatedAssessmentId !== initialAssessmentId, 'Recalculation created a brand new assessment version in PostgreSQL');
  assert(recalculatedScore > initialScore, `Recalculated score improved from ${initialScore} to ${recalculatedScore} due to improved practices`);
  console.log(`  New Assessment Score: ${recalculatedScore} / 100 (${recalcJson.data.readinessLevel})`);

  // 12. Assessment History Verification
  logStep(12, 'Fetching Farm Assessment History via GET /api/farms/:farmId/assessments');
  const historyRes = await fetch(`${API_BASE}/farms/${farmId}/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(historyRes.ok, 'GET /api/farms/:farmId/assessments returned HTTP 200');
  const historyJson = await historyRes.json();
  assert(Array.isArray(historyJson.data) && historyJson.data.length === 2, 'Farm assessment history contains exactly 2 chronological versions');
  assert(historyJson.data[0].id === recalculatedAssessmentId, 'History latest entry is the recalculated assessment');
  assert(historyJson.data[1].id === initialAssessmentId, 'History earlier entry is the initial assessment');

  // 13. Recommendation Toggle
  logStep(13, 'Testing Recommendation Completion Toggle via PATCH /api/assessments/recommendations/:id/toggle');
  if (recalcJson.data.recommendations && recalcJson.data.recommendations.length > 0) {
    const recId = recalcJson.data.recommendations[0].id;
    const toggleRes = await fetch(`${API_BASE}/assessments/recommendations/${recId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(toggleRes.ok, 'PATCH recommendation toggle returned HTTP 200');
    const toggleJson = await toggleRes.json();
    assert(toggleJson.data.completed === true, 'Recommendation completed status toggled to true');
  }

  // 14. Persistence Verification (Re-login & Re-query)
  logStep(14, 'Verifying Full Database Persistence Across Sessions');
  const reLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  assert(reLoginRes.ok, 'Re-login succeeded');
  const newToken = (await reLoginRes.json()).data.token;

  const persistentFarmRes = await fetch(`${API_BASE}/farms/${farmId}`, {
    headers: { Authorization: `Bearer ${newToken}` },
  });
  assert(persistentFarmRes.ok, 'GET /api/farms/:id succeeded after re-login');
  const pFarm = (await persistentFarmRes.json()).data;
  assert(pFarm.name === 'Verma Transitional Farm', 'Farm name persisted in PostgreSQL');
  assert(pFarm.crops.length === 2, '2 Crops persisted in PostgreSQL');
  assert(pFarm.assessments.length === 2, '2 Assessments persisted in PostgreSQL');
  assert(pFarm.documents.length === 1, '1 Document record persisted in PostgreSQL');

  console.log('\n===============================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (14/14 steps)');
  console.log('FarmerChoice frontend API contracts are 100% verified against');
  console.log('the real PostgreSQL-backed backend server.');
  console.log('===============================================================');
}

run().catch(err => {
  console.error('\n❌ Integration Verification Failed:', err);
  process.exit(1);
});
