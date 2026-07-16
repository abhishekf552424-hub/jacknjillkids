import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="font-display text-7xl md:text-9xl text-navy tracking-tight">404</p>
      <p className="mt-4 text-xl text-muted">This little page wandered off.</p>
      <Link href="/" className="mt-8 bg-navy text-white rounded px-6 py-3 font-medium">Take me home</Link>
    </div>
  );
}
