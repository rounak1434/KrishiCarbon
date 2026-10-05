import { Router } from "express";
import { Role } from "@prisma/client";
import { AdminController } from "./admin.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/dashboard", AdminController.getDashboard);
router.get("/farmers", AdminController.getFarmers);
router.get("/farms", AdminController.getFarms);
router.get("/assessments", AdminController.getAssessments);
router.get("/statistics", AdminController.getStatistics);
router.get("/audit-logs", AdminController.getAuditLogs);

export default router;
