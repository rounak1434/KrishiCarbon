import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "http";
import app from "../src/app.js";

describe("Strict Validation & Error Envelope Audit", () => {
  let server: Server;
  let baseUrl: string;
  let farmerToken: string;

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

    // Register a dynamic test farmer (not dependent on seed)
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `val.audit.${Date.now()}@agricred.test`,
        password: "AgriCred#2026",
        role: "FARMER",
        name: "Validation Auditor",
        phone: "+91 99999 00000",
        state: "Maharashtra",
        district: "Nagpur",
      }),
    });
    const body = await res.json();
    farmerToken = body.data.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("should reject unauthenticated request with standardized error format", async () => {
    const res = await fetch(`${baseUrl}/api/farms`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toContain("token is missing");
  });

  it("should reject malformed JWT with 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/farms`, {
      headers: { Authorization: "Bearer this-is-not-a-valid-jwt" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject farm creation with negative areaAcres", async () => {
    const res = await fetch(`${baseUrl}/api/farms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        name: "Negative Farm",
        areaAcres: -10,
        soilType: "Loam",
        irrigationMethod: "Drip",
        waterSource: "Canal",
        fertilizerUsage: "Bio",
        pesticideUsage: "IPM",
        tillageMethod: "Zero",
        residueManagement: "Mulch",
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(body.error.details.some((d: { field: string }) => d.field === "areaAcres")).toBe(true);
  });

  it("should reject farm creation with missing required fields", async () => {
    const res = await fetch(`${baseUrl}/api/farms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        name: "Incomplete Farm",
        // missing areaAcres, soilType, tillageMethod, etc.
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject crop creation with invalid historical year", async () => {
    const res = await fetch(`${baseUrl}/api/crops`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        farmId: "00000000-0000-0000-0000-000000000000",
        crop: "Wheat",
        season: "Rabi",
        year: 1800, // Invalid year
        yield: 2.5,
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject unsupported document types", async () => {
    const formData = new FormData();
    formData.append("farmId", "00000000-0000-0000-0000-000000000000");
    formData.append("type", "INVALID_DOCUMENT_TYPE_123");
    formData.append(
      "file",
      new Blob(["dummy pdf content"], { type: "application/pdf" }),
      "test.pdf"
    );

    const res = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${farmerToken}`,
      },
      body: formData,
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
