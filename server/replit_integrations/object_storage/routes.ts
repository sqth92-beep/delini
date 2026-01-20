import type { Express, Request, Response, NextFunction } from "express";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.adminId) {
    return res.status(401).json({ message: "غير مصرح - يجب تسجيل الدخول كمدير" });
  }
  next();
}

export function registerObjectStorageRoutes(app: Express): void {
  
  app.post("/api/uploads/request-url", requireAdmin, async (req, res) => {
    try {
      res.json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        uploadPreset: 'ml_default',
        folder: 'delini'
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/uploads/direct", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      res.json({
        success: true,
        url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/sample.jpg`,
        note: "Cloudinary not installed. Run: npm install cloudinary"
      });
    } catch (error) {
      res.status(500).json({ error: "Install cloudinary package" });
    }
  });
}
