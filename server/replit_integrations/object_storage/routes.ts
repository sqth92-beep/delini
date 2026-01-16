import type { Express, Request, Response, NextFunction } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.adminId) {
    return res.status(401).json({ message: "غير مصرح - يجب تسجيل الدخول كمدير" });
  }
  next();
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading (admin only)
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: Upload URL creation is protected by admin authentication.
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload (ADMIN ONLY).
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", requireAdmin, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name || !contentType || !size) {
        return res.status(400).json({
          error: "الحقول المطلوبة: name, contentType, size",
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return res.status(400).json({
          error: `نوع الملف غير مسموح. الأنواع المسموحة: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }

      if (size > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `حجم الملف يجب أن يكون أقل من ${MAX_FILE_SIZE / (1024 * 1024)} ميجابايت`,
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

