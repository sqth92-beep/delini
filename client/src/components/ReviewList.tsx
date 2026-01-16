import { useReviews } from "@/hooks/use-directory";
import { RatingStars } from "./RatingStars";
import { Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ReviewListProps {
  businessId: number;
}

export function ReviewList({ businessId }: ReviewListProps) {
  const { data: reviews, isLoading } = useReviews(businessId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد تقييمات بعد. كن أول من يقيّم!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-muted/30 rounded-xl p-4 space-y-2"
          data-testid={`review-${review.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-sm">{review.visitorName}</span>
                <RatingStars rating={review.rating} size="sm" />
              </div>
            </div>
            {review.createdAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            )}
          </div>
          {review.comment && (
            <p className="text-muted-foreground text-sm leading-relaxed pr-12">
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
