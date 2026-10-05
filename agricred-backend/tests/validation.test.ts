import { describe, it, expect } from "vitest";
import { createFarmSchema } from "../src/modules/farms/farms.schema.js";
import { registerSchema } from "../src/modules/auth/auth.schema.js";
import { createCropSchema } from "../src/modules/crops/crops.schema.js";

describe("Input Validation Schema Tests", () => {
  it("should fail farm creation if areaAcres is non-positive or required fields are missing", () => {
    const invalidArea = {
      name: "My Farm",
      areaAcres: -5,
      soilType: "Loam",
      irrigationMethod: "Drip",
      waterSource: "Canal",
      fertilizerUsage: "Bio",
      pesticideUsage: "IPM",
      tillageMethod: "Zero",
      residueManagement: "Mulch",
    };

    const res = createFarmSchema.safeParse(invalidArea);
    expect(res.success).toBe(false);
  });

  it("should pass farm creation with valid input", () => {
    const validFarm = {
      name: "My Farm",
      areaAcres: 12.5,
      soilType: "Clay Loam",
      irrigationMethod: "Drip Irrigation",
      waterSource: "Canal",
      fertilizerUsage: "Biofertilizers",
      pesticideUsage: "IPM",
      tillageMethod: "Zero Tillage",
      residueManagement: "Mulch",
      organicPractices: true,
    };

    const res = createFarmSchema.safeParse(validFarm);
    expect(res.success).toBe(true);
  });

  it("should reject invalid email or short password in registration", () => {
    const invalidAuth = {
      email: "not-an-email",
      password: "123",
    };

    const res = registerSchema.safeParse(invalidAuth);
    expect(res.success).toBe(false);
  });

  it("should reject invalid year in crop history", () => {
    const invalidCrop = {
      farmId: "11111111-1111-1111-1111-111111111111",
      crop: "Wheat",
      season: "Rabi",
      year: 1850,
      yield: 3.5,
    };

    const res = createCropSchema.safeParse(invalidCrop);
    expect(res.success).toBe(false);
  });
});
