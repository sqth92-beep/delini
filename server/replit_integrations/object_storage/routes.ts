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

    const data = await response.json();

    // 2. رفع مباشر لـ Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'delini');

    const uploadResponse = await fetch(data.uploadURL, {
      method: 'POST',
      body: formData,
    });

    const result = await uploadResponse.json();

    const finalResult = {
      objectPath: result.secure_url,
      url: result.secure_url,
    };

    options.onSuccess?.(finalResult);
    return finalResult;

  } catch (err) {
    const error = err instanceof Error ? err : new Error("فشل رفع الملف");
    setError(error);
    options.onError?.(error);
    return null;
  } finally {
    setIsUploading(false);
  }
}, [options]);
