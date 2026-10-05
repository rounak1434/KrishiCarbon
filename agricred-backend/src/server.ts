import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { env } from "./config/env.config.js";
import { logger } from "./utils/logger.util.js";
import { prisma } from "./config/prisma.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (env.PORT || 5000);
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 KrishiCarbon Backend Server started on port ${PORT} (binding: ${HOST})`, {
    environment: env.NODE_ENV,
    healthEndpoint: `http://${HOST}:${PORT}/health`,
    readinessEndpoint: `http://${HOST}:${PORT}/ready`,
    apiDocs: `http://${HOST}:${PORT}/api/docs`,
  });
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully shutting down KrishiCarbon server...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Database connection closed. Exiting process.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
