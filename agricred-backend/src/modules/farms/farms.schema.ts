import { z } from "zod";
import { FertilizerCategory, OrganicFertilizerType } from "@prisma/client";

export const FertilizerCategoryEnum = z.nativeEnum(FertilizerCategory);
export const OrganicFertilizerTypeEnum = z.nativeEnum(OrganicFertilizerType);

export const fertilizerCategoryParser = z.preprocess((val) => {
  if (typeof val === "string") {
    const norm = val.trim().toUpperCase();
    if (["ORGANIC", "SYNTHETIC", "INTEGRATED"].includes(norm)) return norm;
  }
  return val;
}, FertilizerCategoryEnum.optional().nullable());

export const organicFertilizerTypeParser = z.preprocess((val) => {
  if (typeof val === "string") {
    const norm = val.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (["COMPOST", "FARMYARD_MANURE", "VERMICOMPOST", "BIOFERTILIZER", "GREEN_MANURE", "OTHER"].includes(norm)) return norm;
    if (norm === "FYM") return "FARMYARD_MANURE";
    if (norm.startsWith("OTHER")) return "OTHER";
  }
  return val;
}, OrganicFertilizerTypeEnum.optional().nullable());

export const createFarmSchema = z
  .object({
    name: z.string().trim().min(2, "Farm name must be at least 2 characters"),
    areaAcres: z.number().positive("Area in acres must be greater than 0"),
    soilType: z.string().trim().min(2, "Soil type is required"),
    irrigationMethod: z.string().trim().min(2, "Irrigation method is required"),
    waterSource: z.string().trim().min(2, "Water source is required"),
    fertilizerUsage: z.string().trim().optional(),
    fertilizerCategory: fertilizerCategoryParser,
    fertilizer: fertilizerCategoryParser,
    organicFertilizerType: organicFertilizerTypeParser,
    pesticideUsage: z.string().trim().min(2, "Pesticide usage is required"),
    tillageMethod: z.string().trim().min(2, "Tillage method is required"),
    residueManagement: z.string().trim().min(2, "Residue management practice is required"),
    organicPractices: z.boolean().default(false),
  })
  .transform((data) => {
    const fertilizerCategory =
      data.fertilizerCategory ??
      data.fertilizer ??
      (data.organicFertilizerType ? FertilizerCategory.ORGANIC : null);
    return {
      name: data.name,
      areaAcres: data.areaAcres,
      soilType: data.soilType,
      irrigationMethod: data.irrigationMethod,
      waterSource: data.waterSource,
      fertilizerUsage: data.fertilizerUsage,
      fertilizerCategory,
      organicFertilizerType: data.organicFertilizerType ?? null,
      pesticideUsage: data.pesticideUsage,
      tillageMethod: data.tillageMethod,
      residueManagement: data.residueManagement,
      organicPractices: data.organicPractices,
    };
  });

export const updateFarmSchema = z
  .object({
    name: z.string().trim().min(2, "Farm name must be at least 2 characters").optional(),
    areaAcres: z.number().positive("Area in acres must be greater than 0").optional(),
    soilType: z.string().trim().min(2, "Soil type is required").optional(),
    irrigationMethod: z.string().trim().min(2, "Irrigation method is required").optional(),
    waterSource: z.string().trim().min(2, "Water source is required").optional(),
    fertilizerUsage: z.string().trim().optional(),
    fertilizerCategory: fertilizerCategoryParser,
    fertilizer: fertilizerCategoryParser,
    organicFertilizerType: organicFertilizerTypeParser,
    pesticideUsage: z.string().trim().min(2, "Pesticide usage is required").optional(),
    tillageMethod: z.string().trim().min(2, "Tillage method is required").optional(),
    residueManagement: z.string().trim().min(2, "Residue management practice is required").optional(),
    organicPractices: z.boolean().optional(),
  })
  .transform((data) => {
    const categoryProvided = data.fertilizerCategory !== undefined ? data.fertilizerCategory : data.fertilizer;
    return {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.areaAcres !== undefined && { areaAcres: data.areaAcres }),
      ...(data.soilType !== undefined && { soilType: data.soilType }),
      ...(data.irrigationMethod !== undefined && { irrigationMethod: data.irrigationMethod }),
      ...(data.waterSource !== undefined && { waterSource: data.waterSource }),
      ...(data.fertilizerUsage !== undefined && { fertilizerUsage: data.fertilizerUsage }),
      ...(categoryProvided !== undefined && { fertilizerCategory: categoryProvided }),
      ...(data.organicFertilizerType !== undefined && { organicFertilizerType: data.organicFertilizerType }),
      ...(data.pesticideUsage !== undefined && { pesticideUsage: data.pesticideUsage }),
      ...(data.tillageMethod !== undefined && { tillageMethod: data.tillageMethod }),
      ...(data.residueManagement !== undefined && { residueManagement: data.residueManagement }),
      ...(data.organicPractices !== undefined && { organicPractices: data.organicPractices }),
    };
  });

export const farmIdParamSchema = z.object({
  id: z.string().uuid("Invalid farm ID format"),
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>;
