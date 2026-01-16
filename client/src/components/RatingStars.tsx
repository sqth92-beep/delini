import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[...Array(maxRating)].map((_, i) => {
          const isFilled = i < Math.round(rating);
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(i)}
              className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"} disabled:cursor-default`}
              data-testid={`star-${i + 1}`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? "text-primary fill-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="font-bold text-foreground mr-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-muted-foreground text-sm">
          ({reviewCount} {reviewCount === 1 ? "تقييم" : "تقييمات"})
        </span>
      )}
    </div>
  );
}
