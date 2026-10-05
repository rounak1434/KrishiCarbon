import { z } from "zod";

export const updateFarmerProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").optional(),
  state: z.string().trim().min(2, "State is required").optional(),
  district: z.string().trim().min(2, "District is required").optional(),
});

export type UpdateFarmerProfileInput = z.infer<typeof updateFarmerProfileSchema>;
