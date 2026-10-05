import Script from "next/script";

/**
 * Google Analytics 4 + Meta Pixel.
 * A tiny inline "queue" is set up straight away so shop events fired early
 * (product view, begin checkout, purchase) are never lost; the real tracking
 * files load later (after the page has loaded) so they don't slow the site.
 * Private order links (?t=…) are never sent to Google or Meta.
 */
export default function AnalyticsPixels({ gaId, pixelId }: { gaId?: string; pixelId?: string }) {
  const ga = gaId && /^G-[A-Z0-9]{4,20}$/i.test(gaId) ? gaId : "";
  const px = pixelId && /^\d{5,20}$/.test(pixelId) ? pixelId : "";
  if (!ga && !px) return null;
  const stub =
    "(function(w){var clean=w.location.href.replace(/([?&])t=[^&#]*/,'$1').replace(/[?&](#|$)/,'$1');" +
    (ga
      ? `w.dataLayer=w.dataLayer||[];w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};w.gtag('js',new Date());w.gtag('config','${ga}',{page_location:clean});`
      : "") +
    (px
      ? "if(!w.fbq){var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!w._fbq)w._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}" +
        `w.fbq('init','${px}');w.fbq('track','PageView');`
      : "") +
    "})(window);";
  return (
    <>
      <script id="jj-analytics-queue" dangerouslySetInnerHTML={{ __html: stub }} />
      {ga && <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="lazyOnload" />}
      {px && <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="lazyOnload" />}
    </>
  );
}
