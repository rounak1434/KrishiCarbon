import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "http";
import app from "../src/app.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { FarmsService } from "../src/modules/farms/farms.service.js";
import { Role } from "@prisma/client";
import { SCORING_CONFIG } from "../src/engine/scoring/scoring.config.js";

describe("Live Express HTTP Integration Tests", () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let farmerToken: string;
  let farmerUserId: string;
  let farmId: string;
  let assessmentId: string;

  const adminEmail = `http.admin.${Date.now()}@agricred.test`;
  const farmerEmail = `http.farmer.${Date.now()}@agricred.test`;

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

    // 1. Register test admin
    await AuthService.register({
      email: adminEmail,
      password: "AdminPassword#2026",
      role: Role.ADMIN,
    });

    // 2. Register test farmer
    const farmerRes = await AuthService.register({
      email: farmerEmail,
      password: "FarmerPassword#2026",
      role: Role.FARMER,
      name: "Lakshmi Devi Test",
      phone: "+91 99123 44556",
      state: "Maharashtra",
      district: "Amravati",
    });
    farmerUserId = farmerRes.user.id;

    // 3. Create a farm for this farmer
    const farm = await FarmsService.createFarm(farmerUserId, {
      name: "Pragati Regenerative Organics",
      areaAcres: 20.0,
      soilType: "Black Cotton Soil",
      irrigationMethod: "Drip Micro-Irrigation",
      waterSource: "Rainwater Pond",
      fertilizerUsage: "Biofertilizers",
      pesticideUsage: "IPM",
      tillageMethod: "Zero Tillage",
      residueManagement: "In-situ Mulching",
      organicPractices: true,
    });
    farmId = farm.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /health - returns 200 ok and service identifier", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("farmerchoice-backend");
  });

  it("GET /ready - returns 200 and database connected", async () => {
    const res = await fetch(`${baseUrl}/ready`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.database).toBe("connected");
  });

  it("POST /api/auth/login - authenticates Admin user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: "AdminPassword#2026",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.role).toBe("ADMIN");
    adminToken = body.data.token;
  });

  it("POST /api/auth/login - authenticates Farmer user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: farmerEmail,
        password: "FarmerPassword#2026",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.farmer).toBeDefined();
    farmerToken = body.data.token;
  });

  it("GET /api/auth/me - returns authenticated user profile without password hash", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(farmerEmail);
    expect(body.data.passwordHash).toBeUndefined();
    expect(body.data.farmer.name).toBe("Lakshmi Devi Test");
  });

  it("GET /api/farms - lists farmer's farms", async () => {
    const res = await fetch(`${baseUrl}/api/farms`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toBe("Pragati Regenerative Organics");
  });

  it("POST /api/assessments - generates full readiness assessment for farm", async () => {
    const res = await fetch(`${baseUrl}/api/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({ farmId }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.overallScore).toBeGreaterThan(0);
    expect(body.data.readinessLevel).toBeDefined();
    expect(body.data.categories.farmingPractices).toBeGreaterThan(0);
    expect(body.data.categories.soilManagement).toBeGreaterThan(0);
    expect(body.data.categories.irrigation).toBeGreaterThan(0);
    expect(body.data.categories.cropHistory).toBeGreaterThan(0);
    expect(body.data.categories.documentation).toBeDefined();
    expect(body.data.categories.evidenceQuality).toBeDefined();
    expect(body.data.engineVersion).toBe(SCORING_CONFIG.engineVersion);
    assessmentId = body.data.id;
  });

  it("GET /api/assessments/:id - retrieves assessment details", async () => {
    const res = await fetch(`${baseUrl}/api/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(assessmentId);
  });

  it("GET /api/farms/:farmId/assessments - retrieves assessment history", async () => {
    const res = await fetch(`${baseUrl}/api/farms/${farmId}/assessments`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/admin/dashboard - provides aggregated stats for admin", async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.overview.totalFarmers).toBeGreaterThanOrEqual(1);
    expect(body.data.overview.totalFarms).toBeGreaterThanOrEqual(1);
    expect(body.data.readinessDistribution).toBeDefined();
    expect(body.data.categoryAverages).toBeDefined();
  });

  it("GET /api/admin/statistics - returns sustainable practices adoption metrics", async () => {
    const res = await fetch(`${baseUrl}/api/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.sustainablePracticeAdoption).toBeDefined();
    expect(body.data.documentBreakdown).toBeDefined();
  });

  it("GET /api/admin/dashboard - rejects unauthorized or farmer user", async () => {
    // Unauthenticated
    const unauthRes = await fetch(`${baseUrl}/api/admin/dashboard`);
    expect(unauthRes.status).toBe(401);

    // Farmer role trying to access admin
    const farmerRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    expect(farmerRes.status).toBe(403);
  });
});
