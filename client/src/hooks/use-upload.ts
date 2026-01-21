import { useState, useCallback } from "react";

interface UseUploadOptions {
  onSuccess?: (response: { objectPath: string; url: string }) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * رفع الملف مباشرة إلى Cloudinary
   */
  const uploadFile = useCallback(async (file: File): Promise<{ objectPath: string; url: string } | null> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. احصل على بيانات Cloudinary من الـ backend
      setProgress(10);
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "image/jpeg",
        }),
      });

      if (!response.ok) {
        throw new Error("فشل في الحصول على بيانات الرفع");
      }

      const data = await response.json();

      // 2. تحقق إذا الـ backend يعطي بيانات Cloudinary
      if (data.uploadURL && data.uploadURL.includes('cloudinary.com')) {
        // رفع لـ Cloudinary مباشرة
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        if (data.folder) formData.append('folder', data.folder);
        if (data.publicId) formData.append('public_id', data.publicId);

        setProgress(30);
        const cloudinaryResponse = await fetch(data.uploadURL, {
          method: 'POST',
          body: formData,
        });

        if (!cloudinaryResponse.ok) {
          throw new Error("فشل رفع الصورة إلى Cloudinary");
        }

        const cloudinaryData = await cloudinaryResponse.json();

        setProgress(100);
        const result = {
          objectPath: cloudinaryData.secure_url,
          url: cloudinaryData.secure_url,
        };

        options.onSuccess?.(result);
        return result;

      } else if (data.cloudName && data.apiKey) {
        // 3. بديل: رفع لـ Cloudinary باستخدام API
        const cloudName = data.cloudName;
        const apiKey = data.apiKey;
        const uploadPreset = data.uploadPreset || 'ml_default';
        const folder = data.folder || 'delini';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        setProgress(30);
        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!cloudinaryResponse.ok) {
          throw new Error("فشل رفع الصورة");
        }

        const cloudinaryData = await cloudinaryResponse.json();

        setProgress(100);
        const result = {
          objectPath: cloudinaryData.secure_url,
          url: cloudinaryData.secure_url,
        };

        options.onSuccess?.(result);
        return result;

      } else {
        throw new Error("بيانات Cloudinary غير متوفرة");
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error("فشل رفع الملف");
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  /**
   * دعم Uppy (اختياري)
   */
  const getUploadParameters = useCallback(async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();

    // إذا Cloudinary يعطي URL مباشر
    if (data.uploadURL && data.uploadURL.includes('cloudinary.com')) {
      return {
        method: "POST",
        url: data.uploadURL,
        fields: {
          upload_preset: 'ml_default',
          folder: data.folder || 'delini',
        },
      };
    }

    throw new Error("Cloudinary upload not configured properly");
  }, []);

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
