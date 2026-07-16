# Jack & Jill — Product Requirements Document (Live)

## Original Problem Statement
Build a single-brand premium enterprise-grade e-commerce platform for "Jack & Jill" — a 22-year-old kids fashion & baby essentials brand from Kolhapur (est. 2003, founder Ajit Mehta). Stack: Next.js + Supabase + Resend + Razorpay + Hostinger. India-first, mobile-first, SEO/AEO optimized, premium boutique-feel UI.

## Stack (locked)
- Next.js 15.5 App Router + TypeScript
- Supabase (Postgres + Auth + Storage + RLS)
- Resend (transactional email)
- Razorpay (payments) — keys admin-configurable via /admin/settings
- Fraunces (display) + DM Sans (body) — non-generic fonts
- Palette: navy #1E2A4A, gold #C9992E, cream #FFF9F2, warm-gradient CTAs

## User Personas
- **Parents/Gifters (customers)**: shop kids fashion/baby essentials, track orders, easy returns
- **Store admin (Ajit / staff)**: manage products, orders, homepage sections, coupons, CMS
- **Order manager**: fulfil + update order statuses
- **Content manager**: CMS, homepage, marketing (no financial data)

## Implemented (2026-02-16)
### Storefront
- Home (dynamic sections from DB: hero carousel, Instagram reels shelf, categories, product shelves, brand story, parents' reviews, trust badges)
- Shop / PLP with combinable filters (category, age group, gender, price, sort) — desktop sidebar + mobile bottom-sheet drawer
- PDP with variant selector (size/color), image gallery, pincode delivery check, reviews, related products, JSON-LD Product schema
- Cart drawer (slide-in from right)
- Checkout (3-step: address → payment → review, Razorpay + COD)
- Order confirmation + Order tracking (public via /track and logged-in via /account)
- Order tracker with animated stepper (Placed → Confirmed → Packed → Shipped → OFD → Delivered)
- Account (profile, order history)
- Auth (email/password + magic link OTP via Supabase)
- About page with timeline
- Contact page (form + Google Maps embed + submissions saved to DB + email notification)
- FAQ page with FAQPage JSON-LD
- Legal pages (privacy, terms, shipping, returns, refund, cancellation) — CMS-editable
- Search page
- 404 + error pages
- Sitemap.xml + robots.txt + Organization/Website JSON-LD

### Admin panel (RBAC: super_admin / order_manager / content_manager)
- Dashboard with stats, recent orders, low-stock alerts
- Products CRUD (variant matrix, images, age groups, SEO fields)
- Categories (tree, image, shape toggle circle/square, menu featured)
- Orders list + detail + status update with customer email notify via Resend
- Customers overview (spend + order count)
- Coupons (percent/flat, min cart, expiry, active)
- Homepage sections (reorder, edit title/subtitle, JSON config, toggle visible)
- CMS (legal pages, FAQs, trust badges)
- Settings — Razorpay keys (stored in `settings` table), shipping/tax rules, COD toggle, contact info

### Backend / Data
- Supabase schema: 20+ tables, RLS enabled on all
- Auto-profile trigger on signup
- Order stock decrement + server-side stock verification pre-payment
- Razorpay webhook (signature-verified) marks orders paid; verify endpoint for redirect callback
- Pincode-based delivery estimation
- Payment falls back to COD if Razorpay keys not configured

## Backlog / Not yet implemented (deferred to P1)
- Google OAuth (schema-ready; needs client_secret + Supabase provider config)
- Instagram/Vimeo reel embed via oEmbed (currently plain image tiles)
- Real courier-partner webhook integration (schema ready, endpoint stubbed)
- Product review submission form (reviews render — moderation UI in admin partial)
- Product bulk CSV import/export in admin
- Abandoned cart email cron job (Resend template exists)
- Refund flow via Razorpay refund API (schema ready)
- Full address book UI in /account
- Admin analytics reports (CSV export)
- Product wishlist read/write via Supabase (currently UI-only heart icon)

## Deployment
- GitHub → Hostinger Node.js hosting
- `.env.example` committed, `.env.local` git-ignored
- Migrations at `/app/supabase/migrations/` — reproducible

## Test credentials
See `/app/memory/test_credentials.md`.
