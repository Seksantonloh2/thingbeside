# THINGBESIDE — Framer handoff

The HTML in this folder is the working prototype. Rebuild it in Framer using these settings.

## Pages
| Page | File | Sections |
|---|---|---|
| Home | index.html | LED preloader → Hero → Stats → Selected work (Voltson, Fernmoor, Saltmere) → Services bento → Process timeline → Pricing → About → FAQ → Final CTA |
| Work | work.html | Page hero → 4 projects, incl. Northbridge (Work page only), each linking to its live Framer site → Final CTA |
| Services | services.html | Page hero → 4 service blocks (photo, description, what's included) → Process → Pricing → FAQ → Final CTA |
| Contact | contact.html | Page hero → Form (name, email, job type, message) + Book a free call card → FAQ |
| Privacy | privacy.html | Linked in the footer. Template text only, so have it reviewed |

## Tokens
- **Font:** Instrument Sans (Google). Weights: 600 for headings, 400–500 for body.
- **Type (desktop / mobile):** Hero 100 / 46px · H2 80 / 38px · Subtitle 20 / 17px (about 1/5 of the title) · Body 17px · Letter-spacing −3.5% on headings.
- **Colours (dark theme):** Background #0A0A0A · Surface #141414 · Surface 2 #1B1B1B · Text #F4F4F2 · Body text #B4B4B0 · Muted #85857F · Line #232323.
- **Accent (highlights, CTAs, timeline, featured plan):** #F90918, solid. No gradients. Use #FF4D57 for small accent text on dark.
- **Status:** success #16A34A · error #DC2626 (form only).
- **Radius:** 14px for cards and inputs, 16px for large cards, pills fully rounded. **Borders:** 1px #E7E7E7. No shadows.
- **Spacing:** section padding 160 / 88px; max width 1240px; side gutter 48 / 16px.

## Interactions in Framer
| Effect | Framer setup |
|---|---|
| LED preloader “THINGBESIDE” | Code component (port `preloader()` from assets/main.js). Runs once per session. |
| Blur-in headings | Appear effect: Blur 12 → 0, Opacity 0 → 1, Y 18 → 0. 0.8s, ease [0.22, 1, 0.36, 1]. Stagger 70ms per word. |
| Glyph kinetic headline | Code component (port `kinetic()`). Starts 1s after the blur-in finishes. Letters scramble for about 300ms, then settle. |
| Pill button | Hover variant: red accent fill wipes left → right, label slides up to a duplicate, arrow exits right and re-enters from the left, circle rotates −45°. Press scale 0.97. |
| Section reveal | Scroll-triggered appear: Y 28, Blur 6, 0.9s. Stagger 90ms in grids. |
| Bento cards | Hover: Y −4, image scale 1.05, red spotlight border follows the cursor (code override). |
| Count-up numbers | Code component, 1.6s ease-out, runs once in view. |
| Liquid cursor | Code component, fixed full-screen canvas, desktop only (port the liquid cursor block). |
| Liquid scroll dock | Fixed bottom pill, appears after the hero. Liquid progress fill + “Get in touch” button. Doubles as the mobile sticky CTA. |
| FAQ | Accordion, one open at a time, 0.5s height ease. |
| Page transitions | Blur 10 + fade, 0.45s, between pages only. In-page links only smooth-scroll. |
| Hero image | Mouse parallax, ±24px. On phones the photo sits behind the copy and the two buttons stack. |
| Smooth scrolling | Inertial wheel scrolling on desktop (lerp 0.1). Use Framer's Smooth Scroll component. Touch devices keep native scrolling. |
| Process timeline | Sticky headline left. Right: vertical line fills with the accent as you scroll, and each numbered dot fills red with a soft halo when it passes 55% of the viewport. Upcoming steps sit at 30% opacity. |
| Pricing (Glow style) | White card with a tinted top panel (plan, price, full-width pill button, fine print) and a “What’s included” checklist. The featured plan is a dark card with a soft red glow and a “Most popular” badge. |

## Still to replace before launch
- Email `hello@thingbeside.com` (placeholder) and ABN `00 000 000 000`.
- Booking link: the “Book a free call” button currently opens an email. Swap in Calendly or Cal.com.
- About photo: a real portrait of Seksan (a labelled placeholder is there now).
- The form needs connecting to Framer Forms.
- Project images are screenshots of the live Framer sites (assets/work-*.jpg). Re-capture them if those sites change.

## Dark theme update
- **Nav:** logo left, centre pill (Home · Work · Services · Contact, active page highlighted), “Get in touch” pill right. Becomes a menu button under 860px.
- **Hero:** the VR figure is cut out onto a transparent WebP (assets/hero-vr.webp) with a red glow behind it.
- **Selected work:** staggered case-study cards. Each has a tilted screenshot, a tag, the title, and two stats. Right column offset by a set margin. Home shows 3 projects, Work shows all 4.
- **Services:** accordion on the right, intro sticky on the left. One item open at a time, with a photo and copy.
- **About:** text on the left, photo on the right.
- **FAQ:** intro on the left, questions on the right.
- **Footer:** the THINGBESIDE wordmark is scaled by JS to fill the container width. The bottom dock is removed.
- **Cursor:** WebGL fluid simulation in red, desktop only. Stops drawing 5 seconds after the mouse stops.
- **Source:** all pages are generated by `build.py` in the project root. Edit there, then run `python build.py`.

## Round 3 changes
- **Email and reply time:** thingbeside@gmail.com, reply within 24 hours. Working hours removed.
- **Hero:** new VR figure cut out onto transparency (assets/hero-vr.webp).
- **Process:** the side image is removed. Intro and timeline only.
- **About:** portrait on the right (assets/about-person.webp), 4:5 crop.
- **FAQ:** stacked. Heading on top, questions below.
- **Selected work:** sticky card stack. Heading sticks on the left, each case card sticks at 120px + 22px per card, so cards pile up as you scroll. Stacks in normal flow on phones.
- **Cursor:** a soft red glow trail that follows the pointer, desktop only. This is a custom build in the Aura style, not the paid Aura Cursor component ($4 on the Framer marketplace). Buy that component if you want the exact one.
- **Phone nav:** the header CTA is hidden under 860px. Only the menu button shows, and the menu has the CTA.

## Round 4 changes
- **Hero:** new VR figure cut out onto transparency (assets/hero-vr.webp).
- **Selected work (Home):** heading on top, cards stacked below, with no stats. Each card shows tag, name and a short description.
- **Work page:** two-column grid. Title and tags sit over each image, with the description below.
- **Services page:** all four services expanded, so nothing is hidden behind a click. The Home page keeps the accordion.
- **Contact form:** posts to Formspree (`formspree.io/f/mvkkdgyn`). The page stays put, shows a thank-you on success, and shows an error message with the email address on failure. Formspree asks for a one-time confirmation of the address on the first submission, so check that inbox.
