"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { wishlist, syncWishlist } from "@/lib/wishlist";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export default function WishlistButton({
  productId,
  name,
  price,
  variant = "icon",
  className = "",
}: {
  productId: string;
  name: string;
  price: number;
  variant?: "icon" | "square";
  className?: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const read = () => setOn(wishlist.has(productId));
    read();
    syncWishlist().then(read);
    window.addEventListener(wishlist.event, read);
    return () => window.removeEventListener(wishlist.event, read);
  }, [productId]);

  const click = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOn((v) => !v);
    const now = await wishlist.toggle(productId);
    setOn(now);
    if (now) {
      track("add_to_wishlist", [{ id: productId, name, price }]);
      toast.success("Saved to wishlist", { action: { label: "View", onClick: () => (window.location.href = "/account/wishlist") } });
    } else {
      toast("Removed from wishlist");
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      data-testid="wishlist-toggle"
      className={cn(
        variant === "icon"
          ? "w-9 h-9 rounded-full bg-white/95 shadow-soft flex items-center justify-center hover:scale-105 transition-transform"
          : "w-12 border-2 rounded-md flex items-center justify-center transition-colors",
        variant === "square" && (on ? "border-action bg-action text-white" : "border-gold text-gold-text hover:bg-cream"),
        className,
      )}
    >
      <Heart key={String(on)} className={cn("w-4 h-4", on && "pop", variant === "icon" && (on ? "text-action" : "text-navy"))} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
