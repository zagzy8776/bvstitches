import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#C7A96B",
  background: "#0B1220",
  ink: "#F4F0E8",
  muted: "#B8B1A5",
};

/*
 * Higgsfield source preserved from the pre-migration state.
 * Original project state: 14128388ab137f2c2824cefa82b424987110891e
 *
 * The clip URLs remain the original Higgsfield atelier assets.
 * BV Stitches CloudFront images are used only as resilient poster fallbacks
 * so the page never shows a broken-image icon while a remote clip loads.
 */
const HIGGSFIELD_CLIP =
  "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey.mp4";
const HIGGSFIELD_MOBILE_CLIP =
  "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey-mobile.mp4";

const POSTER_FALLBACK =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/c4089901-ded9-4586-9770-334c8b8a4218.jpg";
const MOBILE_POSTER_FALLBACK =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/f4d9144d-7725-4f4c-bf22-f10867657de2.jpg";

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "atelier-motion",
    label: "Motion",
    kicker: "Atelier / 02",
    title: "The camera is the tape.",
    body: "A continuous move through the garments, from measured silhouette to textile detail.",
    clip: HIGGSFIELD_CLIP,
    mobileClip: HIGGSFIELD_MOBILE_CLIP,
    poster: POSTER_FALLBACK,
    mobilePoster: MOBILE_POSTER_FALLBACK,
    tags: ["measure", "shape", "detail"],
    scroll: 2.2,
    linger: 0.12,
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
  },
];
