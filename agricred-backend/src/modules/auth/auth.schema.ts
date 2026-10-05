import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z
  .object({
    email: z.string().trim().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.nativeEnum(Role).optional().default(Role.FARMER),
    // Farmer profile fields
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().trim().min(10, "Phone number must be at least 10 digits").optional(),
    state: z.string().trim().min(2, "State is required").optional(),
    district: z.string().trim().min(2, "District is required").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === Role.FARMER) {
      if (!data.name || data.name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required for farmer registration",
          path: ["name"],
        });
      }
      if (!data.phone || data.phone.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid phone number (at least 10 digits) is required for farmer registration",
          path: ["phone"],
        });
      }
      if (!data.state || data.state.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required for farmer registration",
          path: ["state"],
        });
      }
      if (!data.district || data.district.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "District is required for farmer registration",
          path: ["district"],
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
