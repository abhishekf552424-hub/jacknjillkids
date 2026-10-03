"use client";

import dynamic from "next/dynamic";

// Code for the offer pop-up and the help chat is fetched after the page is
// ready, so it no longer slows the first screen. Both look exactly the same.
export const LazyPromoPopup = dynamic(() => import("./PromoPopup"), { ssr: false });
export const LazySupportChat = dynamic(() => import("./SupportChat"), { ssr: false });
