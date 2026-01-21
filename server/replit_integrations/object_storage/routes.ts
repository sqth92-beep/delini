import type { Express, Request, Response, NextFunction } from "express";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.adminId) return res.status(401).json({ message: "غير مصرح" });
  next();
}

export function registerObjectStorageRoutes(app: Express): void {
  app.post("/api/uploads/request-url", requireAdmin, (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name || !contentType || !size) {
        return res.status(400).json({ error: "الحقول المطلوبة: name, contentType, size" });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(contentType)) {
        return res.status(400).json({ error: "نوع الملف غير مسموح" });
      }

      if (size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "حجم الملف يجب أن يكون أقل من 5 ميجابايت" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dllsznmnq';
      const apiKey = process.env.CLOUDINARY_API_KEY || '915772657186991';
      const folder = 'delini';
      const publicId = `delini_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      res.json({
        success: true,
        cloudName: cloudName,
        apiKey: apiKey,
        uploadPreset: 'ml_default',
        folder: folder,
        publicId: publicId,
        uploadURL: `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        timestamp: Math.round((new Date()).getTime() / 1000),
      });
    } catch (error) {
      console.error("Error in upload request:", error);
      res.status(500).json({ error: "فشل في إعداد بيانات الرفع" });
    }
  });
}
