# EP `결` 비주얼 개편 Design QA

- source visual truth: `C:\Users\daint\Downloads\결 앨범 이미지.jpeg` (550 × 550 px), `C:\Users\daint\Downloads\홍이삭 결 프로필.png` (1440 × 1080 px)
- implementation: `http://localhost:3001/`
- implementation screenshots:
  - `docs/qa/gyeol-hero-2026-11-13/desktop-1440x900.png`
  - `docs/qa/gyeol-hero-2026-11-13/mobile-narrow-final.png`
  - `docs/qa/gyeol-hero-2026-11-13/source-vs-implementation.png`
- desktop viewport: 1440 × 900 CSS px, device scale factor 1
- source/implementation comparison pixels: 550 × 550 source normalized to 900 × 900 beside a 1440 × 900 implementation capture; combined image 2340 × 900
- mobile evidence: 390 × 844 output crop. Headless Edge enforces a wider minimum layout viewport, so this capture is supporting narrow-layout evidence rather than a pixel-perfect 390 CSS px comparison.
- state: home hero, unscrolled; local development build

## Findings

No actionable P0/P1/P2 findings remain.

- Typography: the existing Isaac Hong logotype remains the primary display mark. Small uppercase labels use the established Inter letter spacing and maintain readable optical weight against the dark gradient.
- Spacing and layout rhythm: the album art remains dominant, the duplicated upper crop reads as a deliberate ribbon below the fixed navigation, and the hero controls stay grouped in the lower safe area.
- Colors and tokens: navigation, accent, borders, background, and card tokens now derive from the album art's deep red, ink black, gray paper, and ivory tones.
- Image quality: both supplied source assets are used directly. The hero uses the album cover without reconstructed graphics; the profile uses the supplied 4:3 photograph without portrait cropping.
- Copy/content: `7th EP · GYEOL` identifies the campaign while official and personal channel labels retain their previous meaning.

## Focused comparison evidence

The combined comparison verifies the album's red band, black type, monochrome double-profile, and paper texture are preserved in the hero. A separate focused crop was not required because these elements and the complete control group are legible in the 1440 × 900 full-view comparison. The profile asset was checked at its native 4:3 ratio in the implemented component.

## Comparison history

1. Initial desktop pass: composition, palette, and source-image fidelity passed. The full album art and the repeated red ribbon were both visible.
2. Initial narrow pass: the five official-channel controls could extend beyond the visible right edge in a narrow capture (P2).
3. Fix: each official-channel control now uses a two-column mobile basis with reduced horizontal padding and returns to content-width buttons at `sm` and above.
4. Post-fix evidence: `mobile-narrow-final.png` shows the controls arranged as two columns plus a centered final Melon control; source image and hero identity remain intact.

## Interaction and runtime checks

- Browser-rendered in the in-app browser at `http://localhost:3001/`.
- Verified navigation links, external-channel link labels, album cards, schedule calendar, and profile image are present in the accessibility tree.
- Development server and production build reported no runtime or compilation errors.
- `npm run check:youtube-releases` and `npm run build` passed.

## Follow-up polish

- P3: after the EP campaign ends, consider restoring a less release-specific hero while retaining the `결` palette as an archived seasonal theme.

final result: passed
