import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  productId: string;
  orderId: string;
  productName: string;
  onSubmitted?: () => void;
};

export function ReviewForm({ productId, orderId, productName, onSubmitted }: Props) {
  const { user, username } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in first");
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        order_id: orderId,
        user_id: user.id,
        author_name: username ?? "Customer",
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks for your review!");
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      onSubmitted?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold">Review {productName}</p>

      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "size-6",
                n <= rating ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor={`rv-title-${productId}`}>Headline</Label>
        <Input
          id={`rv-title-${productId}`}
          value={title}
          maxLength={80}
          placeholder="Great fit, fast delivery"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        <Label htmlFor={`rv-body-${productId}`}>Your experience</Label>
        <Textarea
          id={`rv-body-${productId}`}
          rows={3}
          maxLength={800}
          value={comment}
          placeholder="How is the quality, sizing and delivery?"
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button
        className="mt-3 font-semibold uppercase tracking-wide"
        disabled={submit.isPending || comment.trim().length < 3}
        onClick={() => submit.mutate()}
      >
        Submit review
      </Button>
    </div>
  );
}
