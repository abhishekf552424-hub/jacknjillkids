/** Thin butter bar above the header: delivery, exchange and COD promise. */
export default function AnnouncementBar({ freeAbove, exchangeDays, cod }: { freeAbove?: number; exchangeDays?: number; cod?: boolean }) {
  const bits = [
    freeAbove ? `Free delivery above ₹${freeAbove.toLocaleString("en-IN")}` : null,
    exchangeDays ? `Easy ${exchangeDays}-day exchange` : null,
    cod ? "COD available" : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return (
    <div className="bg-butter text-ink text-center text-xs leading-4 font-extrabold px-4 py-2" data-testid="announcement-bar">
      {bits.join(" · ")}
    </div>
  );
}
