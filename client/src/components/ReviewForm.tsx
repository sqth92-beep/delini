import { useState } from "react";
import { useCreateReview } from "@/hooks/use-directory";
import { RatingStars } from "./RatingStars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface ReviewFormProps {
  businessId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ businessId, onSuccess }: ReviewFormProps) {
  const [visitorName, setVisitorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  
  const createReview = useCreateReview(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitorName.trim()) {
      toast({ title: "خطأ", description: "الرجاء إدخال اسمك", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "خطأ", description: "الرجاء اختيار تقييم", variant: "destructive" });
      return;
    }

    try {
      await createReview.mutateAsync({
        visitorName: visitorName.trim(),
        rating,
        comment: comment.trim() || undefined,
      });
      
      toast({ title: "شكراً لك!", description: "تم إضافة تقييمك بنجاح" });
      setVisitorName("");
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إضافة التقييم", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 rounded-2xl p-4">
      <h4 className="font-bold text-lg">أضف تقييمك</h4>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">اسمك</label>
        <Input
          placeholder="أدخل اسمك"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="bg-background"
          data-testid="input-reviewer-name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">تقييمك</label>
        <RatingStars
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">رأيك (اختياري)</label>
        <Textarea
          placeholder="شاركنا تجربتك..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-background min-h-[80px] resize-none"
          data-testid="input-review-comment"
        />
      </div>

      <Button 
        type="submit" 
        disabled={createReview.isPending}
        className="w-full gap-2"
        data-testid="button-submit-review"
      >
        {createReview.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        إرسال التقييم
      </Button>
    </form>
  );
}
