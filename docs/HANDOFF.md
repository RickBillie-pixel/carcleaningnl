# Handoff prompt — CarCleaningNL, van statische demo naar productieproject

Paste everything below the line into a fresh chat. It is written to be
self-contained: it carries the brand facts, the measured design system, the
hard constraints and the open questions, so the next session does not have to
rediscover any of it.

---

## Context

I run CarCleaningNL, auto detailing in Helmond for the Eindhoven region. There
is a working static design demo in this repo at `demo-1e/` that I am happy with
visually. It is live at https://carcleaningnl-d8ec7.web.app and the source is at
https://github.com/RickBillie-pixel/carcleaningnl.

I want you to build it out into a real production project: **Node.js +
TypeScript + React**, with proper copywriting, real UI/UX thinking, the genuine
WhatsApp and Google brand marks, and an authentic feel — not a template.

## Read this first, before proposing an architecture

`demo-1e` today is three static files (`index.html`, `afspraak.html`, one CSS
file) plus ~50 kB of self-hosted fonts and vanilla JS. It has no build step, it
renders instantly, it works with JavaScript disabled, and every price links
straight into the booking flow.

That is a real asset for a local service business, where organic search is the
main channel. **Before you convert anything, tell me honestly whether React
earns its place here, and if so in what shape.** I expect you to push back if a
client-rendered SPA would be worse than what exists. If you do recommend React,
default to a framework that ships static HTML (Next.js with static export, or
Astro with React islands) rather than a Vite SPA, and say why. Do not silently
turn a fast static page into a hydration-heavy bundle.

Whatever you choose: server-rendered or statically generated HTML, real `<a>`
navigation, no layout shift, Lighthouse green on mobile.

## The brand facts — all verified, never invent more

- Name: CarCleaningNL. Site: carcleaningnl.com
- Address: Meester Strikstraat 8, 5708 GB Helmond
- Phone / WhatsApp: +31 6 47421988 — `https://wa.me/31647421988`
- KVK: 88665690
- Hours: ma–vr 08:00–18:00, za 10:00–17:00, zo 10:00–17:00
- Rating: 5,0 out of 5,0 — 500+ customers. Both are on carcleaningnl.com.
- Service area: pickup and delivery across the Eindhoven region
- Instagram: @carcleaningnl · TikTok: @carcleaningnl_

Prices (these are the real price list, keep them exact):

| Dienst | Prijs | slug |
|---|---|---|
| Bekledingsreiniging | €59 | `bekledingsreiniging` |
| Koplamp restauratie | €69 | `koplamp` |
| Ozonbehandeling | €79 | `ozonbehandeling` |
| Leerbehandeling | €79 | `leerbehandeling` |
| Cabriodak reinigen | €119 | `cabriodak` |
| Interieur reiniging | €139 | `interieur` |
| Exterieur reiniging | €139 | `exterieur` |
| Polijsten | €179 | `polijsten` |
| Keramische coating | €899 | `coating` |
| Pakket Compleet | €239 | `compleet` |
| Pakket Premium | €439 | `premium` |
| Pakket Showroom | €639 | `showroom` |

**Hard rule: invent nothing.** No fake reviews, no fake customer names, no
stock-photo avatars, no made-up guarantees, awards or years-in-business. If a
section needs content I have not supplied, build the component and leave a
clearly marked empty state, then ask me for the real content. The previous
session correctly refused to write review text it could not verify — hold that
line.

## The design system, already derived from the reference

`inspiration/image1.png` is the reference. The demo matches it deliberately;
these values were measured, not guessed. Carry them over.

**Type**
- Display: **Antonio 700**, uppercase, `letter-spacing: -0.022em`. Chosen by
  measuring the reference's glyph ink widths over cap height (D/cap 0.44,
  I/cap 0.16, D/I 2.60) — Antonio matched within 5%, everything else was 15–120% off.
- Body/UI: **Urbanist**, 500 for text, 600–700 for headings. Matched on per-word
  ink width over cap height to within 2%.
- Both self-hosted variable woff2, latin subset, ~53 kB total. Keep them
  self-hosted; do not switch to a font CDN.

**Colour**
- Ink: `#002538` (navy, sampled from the logo)
- Interactive azure: `#1476bb` — deliberately a shade deeper than the sampled
  `#1b87d4` so white text on it reaches 4.8:1. Keep the accessible one for
  buttons and links; `#1b87d4` is only used for the hero light field.
- Tint: `#f2f6f9`, hairline `#e4ebf1`, muted text `#4c6272`

**Layout**
- Everything is expressed as a ratio of the content width, so the composition
  reads the same from 360 to 2560 px. Title cap height = 18.4% of content width.
  Hero photo 2.055:1. Overlay cards 59.4% / 31.8% wide at 2.8% inset.
- Hero height is viewport-aware so the whole block fits a laptop fold.

**Motion**
- Lenis smooth scroll (self-hosted, MIT), ease-out-expo, disabled entirely under
  `prefers-reduced-motion`.
- Reveals are gated on an `html.js` class so content is never invisible without JS.
- Transform and opacity only. No layout-property animation, no bounce.

## What I want built out

1. **Real brand marks.** Use the genuine WhatsApp logo and the genuine
   four-colour Google G — correct geometry and official colours, respecting each
   company's brand guidelines for attribution use. The current Google G is
   already accurate; the WhatsApp glyph should be replaced with the official mark.
2. **Copywriting.** Rewrite the whole site in proper Dutch: specific, confident,
   no filler, no "wij zijn gepassioneerd over". Write for someone in Helmond
   comparing three detailers. Lead with what they actually want to know: what it
   costs, how long it takes, whether you collect the car. Every claim must trace
   to a fact in the list above.
3. **Google reviews, properly.** I will supply the real review texts. Build the
   component now — star rating, quote, name, month/year, Google attribution —
   with a clean empty state until I paste them in.
4. **Booking flow.** Today it deep-links `afspraak.html?dienst=<slug>` and hands
   off to WhatsApp. Design something better: service picker, pickup toggle, date
   preference, and a confirmation the customer can trust. Still no backend unless
   you make the case for one.
5. **UX pass.** Real information architecture, not a section stack. Think about
   what a first-time visitor needs in what order, and what a returning customer
   needs (they want the phone number in one tap).
6. **Authentic, not templated.** The reference is a strong starting point but the
   site should feel like this specific business in this specific town. Avoid the
   saturated AI landing-page grammar: no tiny uppercase eyebrow above every
   section, no numbered `01 / 02 / 03` scaffolding, no gradient text, no
   identical icon-card grids, no glassmorphism.

## Tooling that already exists — use it, do not rebuild it

```bash
node tools/serve.mjs                 # dev server on :8123
cd tools && node shots.mjs <ronde> demo-1e   # 390x844@3, 1440x900, 2560x1440
node ovf.mjs  demo-1e index          # horizontal overflow per viewport
node a11y.mjs demo-1e                # contrast, touch targets, heading order
node sbs.mjs  <ronde>                # side by side against inspiration/image1.png
```

Screenshot output goes to `<demo>/screens/` and is gitignored.

Hosting is Firebase (project `carcleaningnl-d8ec7`), `firebase deploy --only
hosting`. `firebase.json` currently serves `demo-1e` at the root — update it
when the build output moves.

## Standards I expect you to hold

- WCAG AA: no text below 4.5:1 (3:1 for large), 24 px minimum touch targets,
  visible focus, correct heading order
- No horizontal overflow at any width from 360 to 2560
- Works with JavaScript disabled and with reduced motion
- Real screenshots at all three viewports each round, and name the concrete
  differences you fixed — do not tell me it looks good, show me
- No secrets in the repo. `tools/kie-*.mjs` read `KIE_KEY` from the environment.

## Start here

Read `demo-1e/index.html` and `demo-1e/assets/style.css` in full, look at
`inspiration/image1.png`, then come back to me with: your architecture
recommendation and the honest tradeoff, your proposed information architecture,
and the three things you think are weakest in the current demo. Do not start
writing code until we have agreed on that.
