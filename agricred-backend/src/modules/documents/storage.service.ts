import fs from "fs";
import path from "path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../../config/env.config.js";
import { logger } from "../../utils/logger.util.js";
import { InternalServerError } from "../../utils/errors.util.js";

export interface StoredFileResult {
  filename: string;
  storageUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface FileDownloadTarget {
  type: "file" | "url";
  filePath?: string;
  url?: string;
  filename: string;
  mimeType: string;
}

export interface IDocumentStorageService {
  saveFile(file: Express.Multer.File): Promise<StoredFileResult>;
  getFilePath(storageUrl: string): string | null;
  getDownloadTarget(storageUrl: string, filename: string, mimeType: string): Promise<FileDownloadTarget>;
  deleteFile(storageUrl: string): Promise<boolean>;
}

/**
 * Local Document Storage (Default for development)
 */
export class LocalDocumentStorageService implements IDocumentStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.STORAGE_PATH);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    const filename = path.basename(file.path);
    const storageUrl = `/uploads/${filename}`;

    return {
      filename: file.originalname,
      storageUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  public getFilePath(storageUrl: string): string | null {
    const filename = path.basename(storageUrl);
    const fullPath = path.join(this.baseDir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  public async getDownloadTarget(storageUrl: string, filename: string, mimeType: string): Promise<FileDownloadTarget> {
    const filePath = this.getFilePath(storageUrl);
    if (!filePath) {
      throw new Error(`File not found at storage URL: ${storageUrl}`);
    }
    return {
      type: "file",
      filePath,
      filename,
      mimeType,
    };
  }

  public async deleteFile(storageUrl: string): Promise<boolean> {
    const filePath = this.getFilePath(storageUrl);
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (err) {
        logger.error("Failed to delete file from local storage", { error: String(err), storageUrl });
        return false;
      }
    }
    return false;
  }
}

/**
 * Cloudinary Document Storage (For production deployment)
 */
export class CloudinaryDocumentStorageService implements IDocumentStorageService {
  private folder: string;

  constructor() {
    this.folder = env.CLOUDINARY_FOLDER || "krishicarbon_documents";

    if (env.CLOUDINARY_URL) {
      cloudinary.config();
    } else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      logger.warn("CloudinaryDocumentStorageService initialized without full credentials. Storage operations may fail.");
    }
  }

  public async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const publicId = `${baseName}_${Date.now()}`;

    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: this.folder,
            resource_type: "auto",
            public_id: publicId,
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary upload returned empty response"));
            }
            resolve(result);
          }
        );

        if (file.buffer) {
          uploadStream.end(file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
          const readStream = fs.createReadStream(file.path);
          readStream.pipe(uploadStream);
          readStream.on("error", reject);
        } else {
          reject(new Error("No file content found for Cloudinary upload"));
        }
      });

      // Cleanup local temp file if present
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          logger.warn("Could not delete temporary upload file after Cloudinary upload", { error: String(cleanupErr) });
        }
      }

      return {
        filename: file.originalname,
        storageUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes || file.size,
        mimeType: file.mimetype,
      };
    } catch (err) {
      // Ensure temp file is cleaned up even on failure
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      logger.error("Failed to upload document to Cloudinary", { error: String(err), filename: file.originalname });
      throw new InternalServerError("Cloud document storage upload failed");
    }
  }

  public getFilePath(storageUrl: string): string | null {
    // Cloudinary files do not have local file paths
    if (storageUrl.startsWith("http://") || storageUrl.startsWith("https://")) {
      return null;
    }
    // Fallback if URL was saved in local format
    const localFallback = path.join(path.resolve(env.STORAGE_PATH), path.basename(storageUrl));
    return fs.existsSync(localFallback) ? localFallback : null;
  }

  public async getDownloadTarget(storageUrl: string, filename: string, mimeType: string): Promise<FileDownloadTarget> {
    if (storageUrl.startsWith("http://") || storageUrl.startsWith("https://")) {
      return {
        type: "url",
        url: storageUrl,
        filename,
        mimeType,
      };
    }

    // Local fallback if legacy record
    const localPath = this.getFilePath(storageUrl);
    if (localPath) {
      return {
        type: "file",
        filePath: localPath,
        filename,
        mimeType,
      };
    }

    throw new Error(`File not accessible at: ${storageUrl}`);
  }

  public async deleteFile(storageUrl: string): Promise<boolean> {
    try {
      const publicId = this.extractPublicId(storageUrl);
      if (!publicId) {
        logger.warn("Could not extract Cloudinary public_id from URL", { storageUrl });
        return false;
      }

      // Try destroying as image first (most common for docs/photos)
      let res = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      if (res.result === "ok") return true;

      // Try destroying as raw (for non-image raw files/PDFs)
      res = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      return res.result === "ok";
    } catch (err) {
      logger.error("Failed to delete document from Cloudinary", { error: String(err), storageUrl });
      return false;
    }
  }

  private extractPublicId(url: string): string | null {
    try {
      // Example URL: https://res.cloudinary.com/cloud/image/upload/v12345/krishicarbon_documents/file_123.pdf
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/");
      const uploadIdx = parts.indexOf("upload");
      if (uploadIdx === -1) return null;

      // Skip 'upload' and optional 'v12345678' version tag
      let startIndex = uploadIdx + 1;
      const potentialVersion = parts[startIndex];
      if (potentialVersion && /^v\d+$/.test(potentialVersion)) {
        startIndex++;
      }

      const publicIdWithExt = parts.slice(startIndex).join("/");
      // Remove file extension
      const lastDotIdx = publicIdWithExt.lastIndexOf(".");
      if (lastDotIdx !== -1) {
        return publicIdWithExt.substring(0, lastDotIdx);
      }
      return publicIdWithExt;
    } catch {
      return null;
    }
  }
}

/**
 * Storage Service Factory
 */
export function createStorageService(): IDocumentStorageService {
  if (env.STORAGE_PROVIDER === "cloudinary") {
    logger.info("📦 Using Cloudinary Document Storage Service");
    return new CloudinaryDocumentStorageService();
  }
  return new LocalDocumentStorageService();
}

export const documentStorageService: IDocumentStorageService = createStorageService();
