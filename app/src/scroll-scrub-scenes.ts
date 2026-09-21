import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#C7A96B",
  background: "#0B1220",
  ink: "#F4F0E8",
  muted: "#B8B1A5",
};

/*
 * Video clips are self-hosted in app/public/assets/world/.
 * Same-origin files pass the existing CSP (connect-src 'self';
 * media-src 'self' blob:) — no security-headers changes needed.
 *
 * The original Higgsfield URLs are preserved on branch
 * preserve/higgsfield-original-2026-09-21 (ref 14128388ab137f2c2824cefa82b424987110891e).
 */
const CLIP = "/assets/world/atelier-journey.mp4";

const POSTER_FALLBACK =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/c4089901-ded9-4586-9770-334c8b8a4218.jpg";

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "atelier-motion",
    kicker: "Atelier / 02",
    title: "The camera is the tape.",
    body: "A continuous move through the garments, from measured silhouette to textile detail.",
    clip: CLIP,
    poster: POSTER_FALLBACK,
    tags: ["measure", "shape", "detail"],
    scroll: 2.2,
    linger: 0.12,
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
  },
];
