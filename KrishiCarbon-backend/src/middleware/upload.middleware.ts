import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { BadRequestError } from "../utils/errors.util.js";
import { env } from "../config/env.config.js";

// Ensure uploads directory exists
const uploadDir = path.resolve(env.STORAGE_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const safeName = `${path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_")}-${uniqueSuffix}${ext}`;
    cb(null, safeName);
  },
});

const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new BadRequestError("Only PDF, JPEG, and PNG files are accepted."));
  }
};

export const uploadSingleDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter,
}).single("file");
