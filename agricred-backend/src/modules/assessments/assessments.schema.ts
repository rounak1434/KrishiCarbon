import { z } from "zod";

export const createAssessmentSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
});

export const assessmentIdParamSchema = z.object({
  id: z.string().uuid("Invalid assessment ID format"),
});

export const farmIdAssessmentsParamSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
});

export const recommendationIdParamSchema = z.object({
  id: z.string().uuid("Invalid recommendation ID format"),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
