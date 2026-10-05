import { z } from "zod";

export const createCropSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
  crop: z.string().trim().min(2, "Crop name must be at least 2 characters"),
  season: z.string().trim().min(2, "Season is required (e.g., Kharif, Rabi, Zaid)"),
  year: z.number().int().min(1990, "Year must be 1990 or later").max(new Date().getFullYear() + 1, "Year cannot be in distant future"),
  yield: z.number().min(0, "Yield must be 0 or greater"),
});

export const updateCropSchema = z.object({
  crop: z.string().trim().min(2, "Crop name must be at least 2 characters").optional(),
  season: z.string().trim().min(2, "Season is required").optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  yield: z.number().min(0).optional(),
});

export const cropIdParamSchema = z.object({
  id: z.string().uuid("Invalid crop record ID format"),
});

export const farmIdCropsParamSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
});

export type CreateCropInput = z.infer<typeof createCropSchema>;
export type UpdateCropInput = z.infer<typeof updateCropSchema>;
