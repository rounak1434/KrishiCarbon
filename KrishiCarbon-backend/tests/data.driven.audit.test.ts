import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "http";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { Role, DocumentType, DocumentStatus } from "@prisma/client";

describe("Data-Driven Verification & Data-Integrity Audit (No Hardcoded/Mock Data)", () => {
  let server: Server;
  let baseUrl: string;
  let farmerToken: string;
  let farmerUserId: string;
  let adminToken: string;
  let farmId: string;
  let assessment1Id: string;
  let assessment1Score: number;
  let assessment1IrrigationScore: number;
  let assessment1PracticesScore: number;
  let assessment2Id: string;
  let assessment2Score: number;

  const testEmail = `genuine.farmer.${Date.now()}@agricred.test`;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr !== null) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });

    // Login or create an admin token
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (adminUser) {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminUser.email, password: "Admin#2026" }),
      });
      const data = await loginRes.json();
      adminToken = data.data.token;
    }
  });

  afterAll(async () => {
    try {
      if (farmerUserId) {
        await prisma.user.delete({ where: { id: farmerUserId } });
      }
    } catch {
      // Ignore
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("1. Real Empty State: Newly registered farmer has zero farms, zero assessments, zero documents", async () => {
    // Register genuinely new farmer
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "SecretPassword#2026",
        role: "FARMER",
        name: "Devendra Sharma",
        phone: "+91 98111 22334",
        state: "Rajasthan",
        district: "Kota",
      }),
    });

    expect(regRes.status).toBe(201);
    const regData = await regRes.json();
    expect(regData.success).toBe(true);
    farmerToken = regData.data.token;
    farmerUserId = regData.data.user.id;

    // Fetch farms: MUST be genuinely empty []
    const farmsRes = await fetch(`${baseUrl}/api/farms`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    expect(farmsRes.status).toBe(200);
    const farmsData = await farmsRes.json();
    expect(farmsData.success).toBe(true);
    expect(farmsData.data).toEqual([]); // Real empty list, not fake data
  });

  it("2. Create farm with actual conventional/degraded attributes into PostgreSQL", async () => {
    const createFarmRes = await fetch(`${baseUrl}/api/farms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        name: "Sharma Agro Lands",
        areaAcres: 18.0,
        soilType: "Sandy Loam",
        irrigationMethod: "FLOOD",
        waterSource: "BOREWELL",
        fertilizerUsage: "HEAVY_CHEMICAL",
        pesticideUsage: "REGULAR_CHEMICAL",
        tillageMethod: "CONVENTIONAL_DEEP",
        residueManagement: "BURNING",
        organicPractices: false,
      }),
    });

    expect(createFarmRes.status).toBe(201);
    const farmData = await createFarmRes.json();
    expect(farmData.success).toBe(true);
    expect(farmData.data.name).toBe("Sharma Agro Lands");
    expect(farmData.data.areaAcres).toBe(18.0);
    farmId = farmData.data.id;
  });

  it("3. Add authentic crop history to farm", async () => {
    const cropRes = await fetch(`${baseUrl}/api/crops`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        farmId,
        crop: "Wheat",
        season: "Rabi",
        year: 2024,
        yield: 3.8,
      }),
    });

    expect(cropRes.status).toBe(201);
    const cropData = await cropRes.json();
    expect(cropData.success).toBe(true);
    expect(cropData.data.crop).toBe("Wheat");
  });

  it("4. Run assessment: score and categories are calculated dynamically from the database", async () => {
    const assessRes = await fetch(`${baseUrl}/api/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({ farmId }),
    });

    expect(assessRes.status).toBe(201);
    const assessData = await assessRes.json();
    expect(assessData.success).toBe(true);

    assessment1Id = assessData.data.id;
    assessment1Score = assessData.data.overallScore;
    assessment1IrrigationScore = assessData.data.categories.irrigation;
    assessment1PracticesScore = assessData.data.categories.farmingPractices;

    // Verify low readiness due to flood irrigation and stubble burning
    expect(assessment1Score).toBeLessThan(50);
    expect(assessData.data.readinessLevel).toBe("NEEDS_IMPROVEMENT");

    // Dynamic gaps generated from actual database attributes
    expect(assessData.data.gaps.some((g: string) => g.toLowerCase().includes("burning"))).toBe(true);
    expect(assessData.data.gaps.some((g: string) => g.toLowerCase().includes("flood"))).toBe(true);

    // Dynamic recommendations generated
    const recs = assessData.data.recommendations;
    expect(recs.some((r: { category: string }) => r.category === "Irrigation")).toBe(true);
    expect(recs.some((r: { category: string; message: string }) => r.category === "Farming Practices" && r.message.includes("burning"))).toBe(true);
  });

  it("5. Data-Integrity Audit: changing database attributes genuinely alters the recalculated score", async () => {
    // Farmer transitions from FLOOD to DRIP, stops burning, adopts zero-till
    const updateRes = await fetch(`${baseUrl}/api/farms/${farmId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        irrigationMethod: "DRIP",
        waterSource: "RAINWATER_HARVESTING",
        tillageMethod: "ZERO_TILL",
        residueManagement: "IN_SITU_MULCHING",
        fertilizerUsage: "BIOFERTILIZER",
        organicPractices: true,
      }),
    });

    expect(updateRes.status).toBe(200);

    // Recalculate assessment
    const recalcRes = await fetch(`${baseUrl}/api/assessments/${assessment1Id}/recalculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(recalcRes.status).toBe(201);
    const recalcData = await recalcRes.json();
    expect(recalcData.success).toBe(true);

    assessment2Id = recalcData.data.id;
    assessment2Score = recalcData.data.overallScore;

    // A brand new assessment was generated
    expect(assessment2Id).not.toBe(assessment1Id);

    // Score increased due to genuine practice upgrades
    expect(assessment2Score).toBeGreaterThan(assessment1Score);

    // Irrigation category score increased substantially (from ~30 to ~85+)
    expect(recalcData.data.categories.irrigation).toBeGreaterThan(assessment1IrrigationScore + 30);

    // Farming practices score increased substantially
    expect(recalcData.data.categories.farmingPractices).toBeGreaterThan(assessment1PracticesScore + 30);
  });

  it("6. Assessment history is authentic: shows both historical versions with immutable initial baseline", async () => {
    const historyRes = await fetch(`${baseUrl}/api/farms/${farmId}/assessments`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(historyRes.status).toBe(200);
    const historyData = await historyRes.json();
    expect(historyData.success).toBe(true);
    expect(historyData.data.length).toBe(2);

    // The oldest historical assessment is unchanged
    const oldest = historyData.data.find((a: { id: string }) => a.id === assessment1Id);
    expect(oldest.overallScore).toBe(assessment1Score);
    expect(oldest.readinessLevel).toBe("NEEDS_IMPROVEMENT");

    // The newest assessment has the upgraded score
    const newest = historyData.data.find((a: { id: string }) => a.id === assessment2Id);
    expect(newest.overallScore).toBe(assessment2Score);
    expect(newest.overallScore).toBeGreaterThan(oldest.overallScore);
  });

  it("7. Admin statistics genuinely reflect real database records", async () => {
    if (!adminToken) return;

    const statsRes = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(statsRes.status).toBe(200);
    const statsData = await statsRes.json();
    expect(statsData.success).toBe(true);

    // totalFarms is a real count from PostgreSQL
    expect(statsData.data.totalFarms).toBeGreaterThan(0);
    expect(typeof statsData.data.sustainablePracticeAdoption.microIrrigationRate).toBe("number");
  });
});
