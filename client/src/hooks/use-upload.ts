import { useState, useCallback } from "react";

interface UseUploadOptions {
  onSuccess?: (response: { objectPath: string; url: string }) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<{ objectPath: string; url: string } | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. احصل على بيانات Cloudinary
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error("فشل في الحصول على بيانات الرفع");
      const data = await response.json();

      // 2. رفع مباشر لـ Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', data.uploadPreset || 'ml_default');
      formData.append('folder', data.folder || 'delini');

      const uploadResponse = await fetch(data.uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error(`Cloudinary error: ${uploadResponse.status}`);

      const result = await uploadResponse.json();

      const finalResult = {
        objectPath: result.secure_url,
        url: result.secure_url,
      };

      options.onSuccess?.(finalResult);
      return finalResult;

    } catch (err) {
      const error = err instanceof Error ? err : new Error("فشل رفع الصورة إلى Cloudinary");
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const getUploadParameters = useCallback(async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });

    const data = await response.json();
    return {
      method: "POST",
      url: data.uploadURL,
      fields: {
        upload_preset: data.uploadPreset,
        folder: data.folder,
      },
    };
  }, []);

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress: 0,
  };
}
