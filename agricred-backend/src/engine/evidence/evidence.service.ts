import { DocumentType, DocumentStatus } from "@prisma/client";
import type { EvidenceAuditSummary, EvidenceItemStatus } from "./evidence.types.js";

const EXPECTED_DOCUMENTS: Array<{ type: DocumentType; label: string; weight: number }> = [
  { type: DocumentType.LAND_DOCUMENT, label: "Land Title / Lease Agreement", weight: 30 },
  { type: DocumentType.SOIL_REPORT, label: "Soil Health & Carbon Test Report", weight: 25 },
  { type: DocumentType.CROP_RECORD, label: "Crop & Yield Records", weight: 15 },
  { type: DocumentType.IRRIGATION_RECORD, label: "Irrigation & Water Management Logs", weight: 15 },
  { type: DocumentType.FERTILIZER_RECORD, label: "Fertilizer / Nutrient Input Records", weight: 15 },
];

export class EvidenceService {
  public static evaluateEvidence(
    documents: Array<{
      id: string;
      type: DocumentType;
      status: DocumentStatus;
      filename: string;
      fileSize: number;
    }>
  ): EvidenceAuditSummary {
    const items: EvidenceItemStatus[] = [];
    const missingTypes: DocumentType[] = [];

    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let documentationScore = 0;

    for (const expected of EXPECTED_DOCUMENTS) {
      // Find matching uploaded documents for this type
      const matching = documents.filter((d) => d.type === expected.type);

      if (matching.length === 0) {
        missingTypes.push(expected.type);
        items.push({
          documentType: expected.type,
          label: expected.label,
          status: "MISSING",
        });
      } else {
        // Pick best status (VERIFIED > PROCESSING/UPLOADED > REVIEW_REQUIRED > REJECTED)
        const isVerified = matching.some((d) => d.status === DocumentStatus.VERIFIED);
        const isReview = matching.some((d) => d.status === DocumentStatus.REVIEW_REQUIRED);
        const isRejected = matching.every((d) => d.status === DocumentStatus.REJECTED);
        const activeDoc = matching[0]!;

        if (isVerified) {
          verifiedCount++;
          documentationScore += expected.weight;
          items.push({
            documentType: expected.type,
            label: expected.label,
            status: "VERIFIED",
            documentId: activeDoc.id,
            filename: activeDoc.filename,
          });
        } else if (isReview) {
          pendingCount++;
          documentationScore += Math.round(expected.weight * 0.6); // partial credit for uploaded but pending review
          items.push({
            documentType: expected.type,
            label: expected.label,
            status: "PENDING_REVIEW",
            documentId: activeDoc.id,
            filename: activeDoc.filename,
          });
        } else if (isRejected) {
          rejectedCount++;
          items.push({
            documentType: expected.type,
            label: expected.label,
            status: "REJECTED",
            documentId: activeDoc.id,
            filename: activeDoc.filename,
          });
        } else {
          // UPLOADED or PROCESSING
          pendingCount++;
          documentationScore += Math.round(expected.weight * 0.5);
          items.push({
            documentType: expected.type,
            label: expected.label,
            status: "UPLOADED",
            documentId: activeDoc.id,
            filename: activeDoc.filename,
          });
        }
      }
    }

    // Additional credit for PRACTICE_PHOTO
    const photoDocs = documents.filter((d) => d.type === DocumentType.PRACTICE_PHOTO);
    const verifiedPhotos = photoDocs.filter((d) => d.status === DocumentStatus.VERIFIED).length;

    // Quality Score Calculation (0 - 100)
    let qualityScore = 0;
    const totalDocs = documents.length;
    if (totalDocs > 0) {
      const verifiedRatio = verifiedCount / EXPECTED_DOCUMENTS.length;
      qualityScore = Math.min(100, Math.round(verifiedRatio * 75 + verifiedPhotos * 15));
    }

    return {
      totalExpected: EXPECTED_DOCUMENTS.length,
      totalUploaded: documents.length,
      verifiedCount,
      pendingCount,
      missingCount: missingTypes.length,
      rejectedCount,
      qualityScore,
      items,
      missingTypes,
    };
  }
}
