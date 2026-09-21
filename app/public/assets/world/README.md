# Video assets for the scroll-scrub "camera is the tape" section

## Required file

| File | Description |
|------|-------------|
| `atelier-journey.mp4` | Desktop clip (landscape, ~16:9 or wider) |

This is the only file the site currently references. It is served same-origin
from `/assets/world/atelier-journey.mp4`, so it passes the existing CSP
(`connect-src 'self'; media-src 'self' blob:`) with no header changes.

## Optional mobile clip

The original Higgsfield build also shipped `atelier-journey-mobile.mp4`
(a taller ~9:16 crop). It is **not** required: when a scene has no `mobileClip`,
`scroll-scrub.tsx` falls back to the desktop `clip` on every viewport.

If you add it later, drop it in this folder and restore both fields in
`src/scroll-scrub-scenes.ts`:

```ts
const MOBILE_CLIP = "/assets/world/atelier-journey-mobile.mp4";
// inside the scene object:
mobileClip: MOBILE_CLIP,
mobilePoster: POSTER_FALLBACK, // a mobilePoster is required whenever mobileClip is set
```

## How to obtain the originals

They were originally hosted at:
- `https://atelier-dimension.higgsfield.app/assets/world/atelier-journey.mp4`
- `https://atelier-dimension.higgsfield.app/assets/world/atelier-journey-mobile.mp4`

Those URLs now sit behind Higgsfield's authentication wall and **cannot be
downloaded publicly** (they return a login page, not a video). To get them:

1. Log in to your Higgsfield account.
2. Download the files from the atelier-dimension project's asset browser.
3. Place them in this directory.

## Size guidelines

The scroll-scrub component downloads the **entire file into memory**
(`fetch()` → `response.blob()` → `URL.createObjectURL`) before playing, so a
large file stalls the section on slow connections.

- Keep the file under **5–8 MB** for a smooth mobile experience.
- If the original is larger, re-encode with:
  ```
  ffmpeg -i atelier-journey.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -an atelier-journey-small.mp4
  ```
- If you cannot get it small enough, host it on Vercel Blob or Cloudflare R2
  instead and add that domain to **both** `connect-src` and `media-src` in
  `src/lib/security-headers.server.ts`, with CORS enabled on the bucket.
