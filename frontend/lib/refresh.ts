import { revalidatePath } from "next/cache";

/**
 * Call after any admin change that customers can see (categories, products,
 * prices, stock, settings, pages, reviews…). Clears the cached pages so the
 * shop shows the change on the very next visit instead of up to a minute later.
 */
export function refreshSite() {
  try {
    revalidatePath("/", "layout");
  } catch {
    /* outside a request (tests/scripts): nothing to refresh */
  }
}
