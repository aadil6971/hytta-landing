# Brief — HYTTA: cabins on the Norwegian fjords

**Client:** HYTTA rents 9 hand-built timber cabins along the Nærøyfjord, Norway. Each cabin has a sauna, a floor-to-ceiling window and no Wi-Fi. From 3,200 NOK / night, minimum 2 nights. Open all year; northern lights season Oct–Mar. (Fictional brand — invent plausible details, no real people.)

**Goal:** get people to check dates and book a cabin (primary CTA "Check availability"), or download the seasonal guide (secondary).

**Art direction:** light, calm, editorial — think Kinfolk magazine meets Scandinavian architecture. Warm off-white paper, deep pine green, charcoal, lots of whitespace, big serif display type, photographic. Slow, soft motion (no bouncy stuff).

**Required sections (your layout):**
1. Hero with a strong headline and a calm, cinematic visual.
2. The fjord — the place, with a scroll-driven moment (e.g. mist lifting, light changing from day to night / northern lights as you scroll).
3. The cabins — 3 cabin types with sizes, what's special, price; an interactive way to browse them.
4. A season picker — toggle Summer / Autumn / Winter / Aurora that changes imagery, copy and what's on.
5. Things to do — hiking, kayaking, sauna + cold plunge, ferry.
6. Guest notes — 3 short fictional quotes (first name + city).
7. Availability — an interactive date/cabin picker mock with price calculation (no backend).
8. FAQ (accessible accordion) + footer with newsletter.
## Rules for every page (read carefully)

You are the sole art director, copywriter and front-end engineer. The result will be recorded on video: real-time scroll-throughs, hover interactions, mobile recordings and close-ups of the details. Build the best landing page you can — something a top design studio would be proud of, not a template.

**Ambition bar**
- At least one real "wow" moment that only works on the web: WebGL/Three.js scene, canvas/SVG generative visual, scroll-driven animation sequence, or physics interaction. It must be tied to the brand, not decoration.
- Scroll storytelling: sections should reveal, pin, move, morph or animate as you scroll (GSAP + ScrollTrigger, Lenis, Three.js via CDN are fine — or vanilla).
- Micro-interactions everywhere: hover states, magnetic/animated buttons, cursor details (desktop), animated counters, toggles that feel good.
- A distinctive typographic system (Google Fonts are fine) and a clear art direction that matches the client below. Avoid generic "AI landing page" look: no default purple gradients, no generic glassmorphism cards, no emoji icons.
- Write all copy yourself. No lorem ipsum. No exclamation-mark hype.

**Images**
- You may generate up to **6 images** with the Higgsfield tools (image models only, no video). Make them feel like one coherent series. Save them in `assets/` as optimised WebP/JPG with width/height set. You can also draw visuals in code.

**Technical**
- Deliver `index.html` (+ `css/`, `js/`, `assets/`) in THIS directory. Must run from a plain static server, no build step.
- Responsive and polished at 375, 768, 1280 and 1920 px. No horizontal scroll. Mobile menu.
- Semantic HTML, keyboard navigable, visible focus, AA contrast, labelled form fields, respects `prefers-reduced-motion`.
- Zero console errors, no broken assets. Aim for Lighthouse Performance ≥ 85 and Accessibility ≥ 95 on desktop.
- Test it in a real browser yourself (screenshots at several widths) before you say you're done.

**Time**: aim to finish within about 60 minutes.

**When done**: print a short summary — headline, concept in one sentence, the wow moment, images generated, anything unfinished.
