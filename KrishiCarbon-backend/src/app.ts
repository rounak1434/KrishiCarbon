import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.config.js";
import { prisma } from "./config/prisma.js";
import { swaggerDocument } from "./config/swagger.js";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

// Module routes
import authRoutes from "./modules/auth/auth.routes.js";
import farmersRoutes from "./modules/farmers/farmers.routes.js";
import farmsRoutes from "./modules/farms/farms.routes.js";
import cropsRoutes from "./modules/crops/crops.routes.js";
import documentsRoutes from "./modules/documents/documents.routes.js";
import assessmentsRoutes from "./modules/assessments/assessments.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app: Application = express();

// Security and standard middleware
app.use(
  process.env.NODE_ENV === "production" ? helmet() : helmet({ contentSecurityPolicy: false })
);

// Production-safe CORS configuration
const allowedOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const devAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!requestOrigin) return callback(null, true);

      const normalizedOrigin = requestOrigin.replace(/\/$/, "");

      // In development or test, allow local dev servers
      if (env.NODE_ENV !== "production") {
        if (allowedOrigins.includes("*") || devAllowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }
      }

      // In production, strictly enforce allowed origins
      if (allowedOrigins.includes("*") || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy does not allow access from origin: ${requestOrigin}`), false);
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Static uploads serving (for local preview if required)
app.use("/uploads", express.static(env.STORAGE_PATH));

// System Health Checks
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "farmerchoice-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "unavailable",
      database: "disconnected",
      message: process.env.NODE_ENV === "production" ? "Database connection failed" : String(err),
    });
  }
});

// Interactive Swagger / OpenAPI Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Apply Rate Limiter to API routes
app.use("/api", apiRateLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmersRoutes);
app.use("/api/farms", farmsRoutes);
app.use("/api/crops", cropsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
