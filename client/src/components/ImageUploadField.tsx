import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  testId?: string;
  previewClassName?: string;
  showPreview?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  placeholder = "https://...",
  testId,
  previewClassName = "w-24 h-24",
  showPreview = true,
}: ImageUploadFieldProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      onChange(response.objectPath);
      toast({ title: "تم رفع الصورة بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في رفع الصورة", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    await uploadFile(file);
    setIsUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          disabled={isUploading}
        />
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            data-testid={testId ? `${testId}-upload` : undefined}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isUploading}
            className="pointer-events-none"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {showPreview && value && (
        <div className={`relative bg-muted rounded-lg overflow-hidden ${previewClassName}`}>
          <img
            src={value}
            alt="معاينة"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
