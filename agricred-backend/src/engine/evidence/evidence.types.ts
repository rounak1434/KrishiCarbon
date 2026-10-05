import type { DocumentType, DocumentStatus } from "@prisma/client";

export interface EvidenceItemStatus {
  documentType: DocumentType;
  label: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "UPLOADED" | "MISSING" | "REJECTED";
  documentId?: string;
  filename?: string;
}

export interface EvidenceAuditSummary {
  totalExpected: number;
  totalUploaded: number;
  verifiedCount: number;
  pendingCount: number;
  missingCount: number;
  rejectedCount: number;
  qualityScore: number; // 0 - 100
  items: EvidenceItemStatus[];
  missingTypes: DocumentType[];
}
