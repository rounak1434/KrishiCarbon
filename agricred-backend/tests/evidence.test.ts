import { describe, it, expect } from "vitest";
import { EvidenceService } from "../src/engine/evidence/evidence.service.js";
import { DocumentType, DocumentStatus } from "@prisma/client";

describe("Evidence Service Tests", () => {
  it("should accurately identify missing document types", () => {
    const documents = [
      {
        id: "d1",
        type: DocumentType.LAND_DOCUMENT,
        status: DocumentStatus.VERIFIED,
        filename: "land.pdf",
        fileSize: 100,
      },
    ];

    const audit = EvidenceService.evaluateEvidence(documents);

    expect(audit.verifiedCount).toBe(1);
    expect(audit.missingCount).toBe(4);
    expect(audit.missingTypes).toContain(DocumentType.SOIL_REPORT);
    expect(audit.missingTypes).toContain(DocumentType.IRRIGATION_RECORD);
    expect(audit.missingTypes).toContain(DocumentType.FERTILIZER_RECORD);
    expect(audit.missingTypes).toContain(DocumentType.CROP_RECORD);
  });

  it("should calculate high quality score when all expected documents are verified plus photos", () => {
    const documents = [
      { id: "1", type: DocumentType.LAND_DOCUMENT, status: DocumentStatus.VERIFIED, filename: "1.pdf", fileSize: 100 },
      { id: "2", type: DocumentType.SOIL_REPORT, status: DocumentStatus.VERIFIED, filename: "2.pdf", fileSize: 100 },
      { id: "3", type: DocumentType.CROP_RECORD, status: DocumentStatus.VERIFIED, filename: "3.pdf", fileSize: 100 },
      { id: "4", type: DocumentType.IRRIGATION_RECORD, status: DocumentStatus.VERIFIED, filename: "4.pdf", fileSize: 100 },
      { id: "5", type: DocumentType.FERTILIZER_RECORD, status: DocumentStatus.VERIFIED, filename: "5.pdf", fileSize: 100 },
      { id: "6", type: DocumentType.PRACTICE_PHOTO, status: DocumentStatus.VERIFIED, filename: "photo.jpg", fileSize: 100 },
    ];

    const audit = EvidenceService.evaluateEvidence(documents);

    expect(audit.missingCount).toBe(0);
    expect(audit.verifiedCount).toBe(5);
    expect(audit.qualityScore).toBeGreaterThanOrEqual(80);
  });
});
