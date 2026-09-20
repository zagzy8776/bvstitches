import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#F3D000",
  background: "#151716",
  ink: "#F4F5F2",
  muted: "#B5BAB4",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "atelier-motion",
    label: "Motion",
    kicker: "Atelier / 02",
    title: "The camera is the tape.",
    body: "A continuous move through the garments, from measured silhouette to textile detail.",
    clip: "/assets/world/atelier-journey.mp4",
    mobileClip: "/assets/world/atelier-journey-mobile.mp4",
    poster: "/assets/world/atelier-journey-poster.png",
    mobilePoster: "/assets/world/atelier-journey-mobile-poster.png",
    tags: ["measure", "shape", "detail"],
    scroll: 2.2,
    linger: 0.12,
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
  },
];
