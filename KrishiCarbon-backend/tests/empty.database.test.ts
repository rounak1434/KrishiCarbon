import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "http";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

describe("Empty Database Operation Audit (Zero Farmers, Zero Farms, Zero Documents)", () => {
  let server: Server;
  let baseUrl: string;
  let farmerToken: string;
  let farmId: string;
  let assessment1Id: string;
  let assessment2Id: string;

  beforeAll(async () => {
    // 1. Wipe database completely clean to test true zero-state behavior
    await prisma.auditLog.deleteMany();
    await prisma.recommendation.deleteMany();
    await prisma.assessmentCategoryScore.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.document.deleteMany();
    await prisma.cropHistory.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.farmer.deleteMany();
    await prisma.user.deleteMany();

    // Verify database is 100% empty
    const [uCount, fCount, farmCount, aCount, dCount] = await Promise.all([
      prisma.user.count(),
      prisma.farmer.count(),
      prisma.farm.count(),
      prisma.assessment.count(),
      prisma.document.count(),
    ]);

    expect(uCount).toBe(0);
    expect(fCount).toBe(0);
    expect(farmCount).toBe(0);
    expect(aCount).toBe(0);
    expect(dCount).toBe(0);

    // 2. Start HTTP server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr !== null) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("1. Health & Database readiness return 200 on an empty database", async () => {
    const healthRes = await fetch(`${baseUrl}/health`);
    expect(healthRes.status).toBe(200);

    const readyRes = await fetch(`${baseUrl}/ready`);
    expect(readyRes.status).toBe(200);
    const readyBody = await readyRes.json();
    expect(readyBody.database).toBe("connected");
  });

  it("2. User registration functions on an empty database without any seeded records", async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fresh.pioneer@agricred.test",
        password: "ProductionPassword#2026",
        role: "FARMER",
        name: "Pioneer Farmer",
        phone: "+91 98888 77777",
        state: "Gujarat",
        district: "Anand",
      }),
    });

    expect(regRes.status).toBe(201);
    const regBody = await regRes.json();
    expect(regBody.success).toBe(true);
    expect(regBody.data.token).toBeDefined();
    expect(regBody.data.user.farmer.name).toBe("Pioneer Farmer");
    farmerToken = regBody.data.token;
  });

  it("3. True Empty State: returns empty farms list [], not fake farms", async () => {
    const farmsRes = await fetch(`${baseUrl}/api/farms`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(farmsRes.status).toBe(200);
    const farmsBody = await farmsRes.json();
    expect(farmsBody.success).toBe(true);
    expect(farmsBody.data).toEqual([]); // Completely empty list
  });

  it("4. Farm creation works on an empty database and persists authentic attributes", async () => {
    const farmRes = await fetch(`${baseUrl}/api/farms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        name: "Anand Organic Farm",
        areaAcres: 25.0,
        soilType: "Alluvial Loam",
        irrigationMethod: "DRIP",
        waterSource: "RAINWATER_POND",
        fertilizerUsage: "BIOFERTILIZER",
        pesticideUsage: "IPM",
        tillageMethod: "ZERO_TILL",
        residueManagement: "IN_SITU_MULCHING",
        organicPractices: true,
      }),
    });

    expect(farmRes.status).toBe(201);
    const farmBody = await farmRes.json();
    expect(farmBody.success).toBe(true);
    expect(farmBody.data.name).toBe("Anand Organic Farm");
    farmId = farmBody.data.id;
  });

  it("5. Crop history creation works and persists to PostgreSQL", async () => {
    const cropRes = await fetch(`${baseUrl}/api/crops`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        farmId,
        crop: "Groundnut",
        season: "Kharif",
        year: 2024,
        yield: 2.4,
      }),
    });

    expect(cropRes.status).toBe(201);
    const cropBody = await cropRes.json();
    expect(cropBody.success).toBe(true);
    expect(cropBody.data.crop).toBe("Groundnut");
  });

  it("6. Document upload works without AI API key (flags REVIEW_REQUIRED gracefully)", async () => {
    const formData = new FormData();
    formData.append("farmId", farmId);
    formData.append("type", "LAND_DOCUMENT");
    formData.append(
      "file",
      new Blob(["%PDF-1.4 Simulated land title on empty db test"], { type: "application/pdf" }),
      "anand_land_title.pdf"
    );

    const docRes = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: formData,
    });

    expect(docRes.status).toBe(201);
    const docBody = await docRes.json();
    expect(docBody.success).toBe(true);
    expect(docBody.data.status).toBe("REVIEW_REQUIRED"); // Not fabricated
    expect(docBody.data.extractedData).toBeNull(); // Not invented
  });

  it("7. Assessment calculation works and persists atomically to empty database", async () => {
    const assessRes = await fetch(`${baseUrl}/api/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({ farmId }),
    });

    expect(assessRes.status).toBe(201);
    const assessBody = await assessRes.json();
    expect(assessBody.success).toBe(true);
    expect(assessBody.data.id).toBeDefined();
    expect(typeof assessBody.data.overallScore).toBe("number");
    expect(assessBody.data.categories).toBeDefined();
    expect(assessBody.data.recommendations).toBeInstanceOf(Array);
    assessment1Id = assessBody.data.id;
  });

  it("8. Assessment retrieval returns the persisted record", async () => {
    const getRes = await fetch(`${baseUrl}/api/assessments/${assessment1Id}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.data.id).toBe(assessment1Id);
  });

  it("9. Assessment recalculation creates a new version while preserving the initial one", async () => {
    const recalcRes = await fetch(`${baseUrl}/api/assessments/${assessment1Id}/recalculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(recalcRes.status).toBe(201);
    const recalcBody = await recalcRes.json();
    expect(recalcBody.success).toBe(true);
    assessment2Id = recalcBody.data.id;
    expect(assessment2Id).not.toBe(assessment1Id);

    // Verify history now contains exactly 2 real records
    const historyRes = await fetch(`${baseUrl}/api/farms/${farmId}/assessments`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(historyRes.status).toBe(200);
    const historyBody = await historyRes.json();
    expect(historyBody.data.length).toBe(2);
  });
});
