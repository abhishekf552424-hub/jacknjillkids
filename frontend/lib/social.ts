/**
 * Social media + Google reviews details, set in Admin → Settings →
 * "Social media & Google reviews". Older Instagram/Facebook links saved under
 * Branding are still used if the new card is empty.
 */
export type Social = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  /** Google Business Profile — page where people read the reviews */
  google_reviews_url?: string;
  /** Google "write a review" link (from GBP → Ask for reviews) */
  google_write_url?: string;
  google_rating?: number;
  google_review_count?: number;
};

const https = (v: unknown) => (typeof v === "string" && /^https:\/\/[^\s"'<>]+$/i.test(v.trim()) ? v.trim() : undefined);

export function normaliseSocial(social: any, brand?: any): Social {
  const s = social || {};
  const rating = Number(s.google_rating);
  const count = Math.round(Number(s.google_review_count));
  return {
    instagram: https(s.instagram) || https(brand?.instagram),
    facebook: https(s.facebook) || https(brand?.facebook),
    youtube: https(s.youtube),
    google_reviews_url: https(s.google_reviews_url),
    google_write_url: https(s.google_write_url),
    google_rating: rating >= 1 && rating <= 5 ? Math.round(rating * 10) / 10 : undefined,
    google_review_count: count > 0 ? count : undefined,
  };
}

/** "@jacknjill_kolhapur" from an Instagram profile link. */
export function instagramHandle(url?: string) {
  const m = url?.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return m ? `@${m[1]}` : undefined;
}
