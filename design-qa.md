# EP `결` 흑백 사진 히어로 Design QA

- source visual truth: `C:\Users\daint\Downloads\결 배경.png` (1440 × 1080 px)
- implementation: `http://localhost:3001/?revision=photo-hero`
- implementation screenshot: `docs/qa/gyeol-hero-2026-11-13/desktop-photo-hero.png`
- combined comparison: `docs/qa/gyeol-hero-2026-11-13/source-vs-photo-hero.png`
- viewport: 1440 × 900 CSS px, device scale factor 1
- comparison pixels: 1440 × 1080 source normalized to 1200 × 900 beside a 1440 × 900 implementation capture; combined image 2640 × 900
- state: home hero, unscrolled; local development build

## Findings

No actionable P0/P1/P2 findings remain.

- Typography: the existing Isaac Hong logotype is rendered in white over the dark lower half of the image. Small uppercase labels preserve the established wide letter spacing and remain legible.
- Spacing and layout rhythm: the fixed red navigation remains visually separate. The campaign label, artist mark, official links, and personal links form a centered stack in the lower safe area without covering the face.
- Colors and tokens: the red navigation and Instagram button carry the `결` campaign accent into the monochrome composition. White controls use translucent borders to avoid a heavy boxed appearance.
- Image quality: the supplied 1440 × 1080 source is used directly as a full-bleed hero with `object-cover`. The focal point keeps the face and diagonal light geometry visible at the desktop reference viewport.
- Copy/content: `7th EP · GYEOL`, the artist name, five official links, and two personal links are all placed on the photo as requested. The separate profile/About section remains removed.

## Full-view comparison evidence

`source-vs-photo-hero.png` shows the source and browser implementation together. The implementation preserves the silhouette, diagonal windows, and high-contrast black-and-white art direction while adding only the requested navigation and channel UI.

## Focused comparison evidence

No extra focused crop was needed because the face, full artist mark, button labels, and photo geometry are all legible in the combined 900px-high comparison.

## Comparison history

1. Earlier attempts used the square album cover as an enlarged or poster-scale hero. User feedback showed that this did not produce the intended landing composition (P1).
2. Fix: replaced the hero source with the supplied black-and-white concept photo, retained the red navigation, and moved the artist name and all channel links onto the image.
3. Post-fix evidence: the browser screenshot shows the full viewport hero, readable overlays, an unobscured face, and no separate profile section.

## Interaction and runtime checks

- Browser-rendered in the in-app browser at the local preview URL.
- Verified navigation, all official/personal channel links, album section, schedule, and news remain present in the accessibility tree.
- Development server and production build reported no runtime or compilation errors.
- `npm run check:youtube-releases` and `npm run build` passed.

## Follow-up polish

- P3: mobile browsers with very tall aspect ratios will crop more of the left window light because the source is landscape; the central face remains the responsive focal point.

final result: passed
