import type { Express, Request, Response, NextFunction } from "express";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.adminId) return res.status(401).json({ message: "غير مصرح" });
  next();
}

export function registerObjectStorageRoutes(app: Express): void {
  app.post("/api/uploads/request-url", requireAdmin, (req, res) => {
    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadPreset: 'ml_default'
    });
  });
}
