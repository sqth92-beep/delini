import type { Express, Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({ storage: multer.memoryStorage() });

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
 * Cloudinary upload routes
 */
export function registerObjectStorageRoutes(app: Express): void {
  // تأكد من تهيئة Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dllsznmnq',
    api_key: process.env.CLOUDINARY_API_KEY || '915772657186991',
    api_secret: process.env.CLOUDINARY_API_SECRET || '1AffZ7CCwTmUTiyr7jnKc0icQAg',
  });

  /**
   * للحصول على بيانات رفع Cloudinary
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

      // إعداد Cloudinary upload
      const timestamp = Math.round((new Date()).getTime() / 1000);
      const folder = 'delini';
      const publicId = `delini_${Date.now()}_${uuidv4().slice(0, 8)}`;

      const params = {
        timestamp,
        folder,
        public_id: publicId,
      };

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET || '1AffZ7CCwTmUTiyr7jnKc0icQAg'
      );

      res.json({
        success: true,
        signature,
        timestamp,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        folder,
        publicId,
        uploadURL: `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/image/upload`
      });
    } catch (error) {
      console.error("Cloudinary error:", error);
      res.status(500).json({ error: "فشل في إعداد الرفع" });
    }
  });

  /**
   * رفع مباشر (للاختبار)
   */
  app.post("/api/uploads/direct", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم اختيار ملف" });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'delini',
            public_id: `delini_${Date.now()}_${uuidv4().slice(0, 8)}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "فشل رفع الملف" });
    }
  });

  /**
   * حذف صورة (اختياري)
   */
  app.delete("/api/uploads/:publicId", requireAdmin, async (req, res) => {
    try {
      const { publicId } = req.params;
      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: "فشل حذف الملف" });
    }
  });
}
