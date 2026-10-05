import { prisma } from "../config/prisma.js";
import { logger } from "./logger.util.js";

export interface CreateAuditLogParams {
  userId?: string | null | undefined;
  action: string;
  entityType: string;
  entityId?: string | null | undefined;
  details?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    // Audit log failure should not crash the core business transaction
    logger.error("Failed to write audit log entry", { error: String(err), params });
  }
}
