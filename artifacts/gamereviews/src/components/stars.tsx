import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarsProps {
  rating: number;
  max?: number;
  interactive?: boolean;
  onRating?: (rating: number) => void;
  className?: string;
}

export function Stars({ rating, max = 5, interactive = false, onRating, className }: StarsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < Math.floor(rating);
        const isHalf = i === Math.floor(rating) && rating % 1 !== 0;
        
        return (
          <motion.button
            key={i}
            type={interactive ? "button" : "button"}
            disabled={!interactive}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            onClick={() => interactive && onRating && onRating(i + 1)}
            className={cn(
              "focus:outline-none transition-colors",
              interactive ? "cursor-pointer" : "cursor-default"
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFilled || isHalf
                  ? "fill-yellow-500 text-yellow-500"
                  : "fill-transparent text-muted-foreground",
                isHalf && "fill-yellow-500/50" // Approximating half star visually
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
