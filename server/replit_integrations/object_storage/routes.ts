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
 * Cloudinary upload routes - حل سريع وجاهز
 */
export function registerObjectStorageRoutes(app: Express): void {
  // تأكد من تهيئة Cloudinary
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * حل مباشر: رفع الملفات إلى Cloudinary
   * POST /api/uploads/request-url
   */
  app.post("/api/uploads/request-url", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      // تحقق من البيانات الأساسية
      if (req.body.name && req.body.size && req.body.contentType) {
        const { name, size, contentType } = req.body;

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
      }

      // إذا كان هناك ملف في الطلب (للتطبيقات القديمة)
      if (req.file) {
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

        return res.json({
          uploadURL: result.secure_url,
          objectPath: result.secure_url,
          metadata: {
            name: req.file.originalname,
            size: req.file.size,
            contentType: req.file.mimetype
          }
        });
      }

      // إذا لا يوجد ملف، نعيد بيانات Cloudinary للرفع من الفرونت اند
      const timestamp = Math.round((new Date()).getTime() / 1000);
      const params = {
        timestamp: timestamp,
        folder: 'delini',
      };

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET || ''
      );

      res.json({
        signature,
        timestamp,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        folder: 'delini',
        publicId: `delini_${Date.now()}`,
        uploadURL: `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/image/upload`
      });

    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: "فشل رفع الملف" });
    }
  });

  /**
   * طريق بديل مباشر
   * POST /api/uploads/direct
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
        objectPath: result.secure_url
      });
    } catch (error) {
      console.error("Direct upload error:", error);
      res.status(500).json({ error: "فشل رفع الملف" });
    }
  });
}
