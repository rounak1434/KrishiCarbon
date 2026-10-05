import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  AI_API_KEY: z.string().optional().default(""),
  STORAGE_PROVIDER: z.enum(["local", "s3", "cloudinary"]).default("local"),
  STORAGE_PATH: z.string().default("./uploads"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  CLOUDINARY_URL: z.string().optional().default(""),
  CLOUDINARY_FOLDER: z.string().default("krishicarbon_documents"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration. Check your .env file.");
  }
  return result.data;
};

export const env = parseEnv();
