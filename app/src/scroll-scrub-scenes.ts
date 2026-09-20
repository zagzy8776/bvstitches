import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#C7A96B",
  background: "#0B1220",
  ink: "#F4F0E8",
  muted: "#B8B1A5",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "atelier-motion",
    label: "Motion",
    kicker: "BV Stitches / Atelier Motion",
    title: "Cut in motion.",
    body: "Move through the atelier sequence from measured silhouette to textile detail, restored as the site's immersive studio chapter.",
    clip: "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey.mp4",
    mobileClip: "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey-mobile.mp4",
    poster: "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey-poster.png",
    mobilePoster: "https://atelier-dimension.higgsfield.app/assets/world/atelier-journey-mobile-poster.png",
    tags: ["measure", "shape", "detail"],
    scroll: 2.2,
    linger: 0.12,
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
  },
];
