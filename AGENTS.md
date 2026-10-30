# AGENTS.md

Guidance for coding agents working on this repo (Francisco Perez's portfolio, Next.js App Router).

## Stack and commands

- Package manager: **pnpm** only (`packageManager` in `package.json`). Never add another lockfile.
- `pnpm dev` / `pnpm build` / `pnpm start`
- Quality gates (same as `.github/workflows/quality.yml`):
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`
  - `pnpm check:shaders`
  - `pnpm build`
  - with `pnpm start` running: `PORTFOLIO_URL=http://localhost:3000 pnpm check:agent` and `pnpm check:portfolio` (Playwright + axe browser checks; update them when UI changes).

## Typography

- Headings use **Oxanium** (OFL, `next/font/local` in the root layout, variable `wght` clamped to 500..700, `display: swap`), exposed as `--font-heading` in `globals.css`; a zero-specificity `@media screen` rule gives every `h1`-`h4` that face. Body copy stays on the system UI stack and kickers/labels on `ui-monospace`. Use `var(--font-heading)` for any new display type; never hard-code Georgia or another serif.
- Web fonts are self-hosted and split per family into a **core** file (ASCII printable + common heading punctuation, preloaded) and an **extended** file (Latin-1, Latin Extended-A and every other glyph the site renders, never preloaded). The CSS family stack lists core, extended, then the automatic next/font fallback metrics, so the extended file downloads only for glyphs the core lacks. `/me` keeps its editorial Fraunces / IBM Plex system via `next/font/google` (measured regression when split per weight, reverted). The CV print layout (and so the PDFs) keeps Fraunces unchanged and print-only.
- `scripts/optimize-fonts.py` regenerates everything in `public/fonts/` from the Google Fonts css2 API (woff2): it instances/clamps weights, subsets, drops unused OpenType features and hinting, verifies exact codepoint coverage, and prints bytes before/after. Requirements: `pip install fonttools brotli`. Rerun it when rendered copy gains characters outside the subsets, upstream font files change version, or a weight range changes; then update the versioned `public/fonts/*-v1.woff2` paths in `src/app/layout.tsx` / `src/app/me/page.tsx` if the version token changes.

## CV pages (/cv, /es/cv)

- Content: `src/content/cv/` is the single typed source (`CvVariant`, `CvLocale`, `CvSection` enums). `facts.ts` holds the real facts from Francisco's CVs; `variants.ts` only reorders and re-emphasises them. Never invent roles, dates, metrics or skills, and never publish a phone number or home address (email, GitHub, LinkedIn and portfolio URL only).
- Rendering: `src/components/cv/` (server components). Routes are static (`generateStaticParams`, `dynamicParams = false`). CV pages wear the portfolio chrome (site nav with the EN/ES switch linking to the counterpart page, cursor trail, a static CSS night-sky backdrop; no WebGPU layer). Keep the backdrop static: nothing may loop under the glass panels (no infinite CSS animations, no shooting stars), because any motion behind `backdrop-filter` re-rasters and re-blurs the whole viewport every frame (prod audit 2026-10-14: 12-23 fps idle on desktop, ~60% raster load on phones). `check:portfolio` fails on any infinite animation on a CV page. `cv.css` keeps two separate blocks: `@media screen` (the portfolio look: glass panels, Oxanium display (the site heading face), mono kickers, entrance motion only under `prefers-reduced-motion: no-preference`) and `@media print` (the clean light A4 résumé the PDFs are rendered from, with every piece of site chrome hidden). Never let screen styles leak into print. The Fraunces / IBM Plex faces are print-only and not preloaded.
- One page: every variant (EN and ES) must fit on ONE A4 page in print and in its PDF (Francisco's rule). `pnpm cv:pdf` and `check:portfolio` fail otherwise. To make room, prioritise per variant in `variants.ts` (drop the least relevant role, bullet or project for that role type, shorten wording without changing facts); never shrink body text below 9.5pt or squeeze margins below 10mm. The screen page shows the same content set.
- Index (/cv, /es/cv): each version is one glass tile that is itself the PDF download link (`download`, aria-label "Download <Version> CV (PDF)"); no inner buttons. The /cv/<variant> pages stay live. User-facing English says "CV", never "Résumé". The site nav has no CV item; the hero CTA downloads the generated Applied AI PDF in the page language (`src/lib/primaryCv.ts` on top of `cvPdfPath`, versioned `?v=`); /me and the MCP profile's `cv_pdf` use the same file. The old hand-committed `/cv/FranciscoPerez-AIEngineer.pdf` is gone and redirects to the English Applied AI PDF.
- PDFs: committed in `public/cv/files/`, rendered from the pages with Playwright. After changing anything in `src/content/cv/` or `src/components/cv/`, rebuild, start the server and run `PORTFOLIO_URL=http://localhost:3000 pnpm cv:pdf`, then commit `public/cv/files/`. They are not generated during `next build` because the build host (Vercel) has no browser. `check:portfolio` fails when `manifest.json`'s source hash no longer matches, so a stale PDF cannot ship. The manifest also records each file's content version; `cvPdfPath()` links `?v=<version>` everywhere (index cards, Download PDF button, MCP `pdf_url`) with a clean `download` filename, versioned URLs are cached `immutable` and bare URLs revalidate (`next.config.ts`), so a regenerated PDF is never served from cache.
- Language: the root layout renders `<html lang="es">`; on CV routes the content root carries the route's `lang` and the i18n provider sets `document.documentElement.lang` from the URL after hydration.

## MCP server and agent discovery (/api/mcp, /for-agents, agent card, llms.txt)

- `src/lib/mcp/tools.ts` is the single source of the tool names, summaries, server name/version and endpoint path; the route, the agent card, `/for-agents`, `/llms.txt` and the assistant prompt all read it. CV versions always come from `src/content/cv` (`CvVariant`); the profile title (role part of the primary CV headline) and the full CV's education come from there too, so the MCP never states a fact the published CV does not.
- The server is stateless Streamable HTTP with JSON responses. Keep the hardening in `src/app/api/mcp/route.ts`: CORS `*` on every response plus an `OPTIONS` preflight (`src/lib/mcp/http.ts`; public, read-only, no credentials), lenient `Accept` (JSON-only or missing is served), a 64 KiB body cap, `tools.listChanged: false`, `GET`/`DELETE` answer 405.
- `/for-agents` keeps only the one-click assistant launchers: the endpoint card and client configs were removed from the page at Francisco's request (2026-10-29). The MCP endpoint stays public through the agent card and `llms.txt`, and the launchers' prompt still points assistants at it.
- Test with a real client before and after changes: `npx @modelcontextprotocol/inspector --cli <url>/api/mcp --transport http --method tools/list`, and `pnpm check:agent` (covers capabilities, invalid args, CORS, Accept, body cap and llms.txt).

## Home scrolling (no scroll-driven animation)

- The home page scrolls natively and nothing on it is tied to the scroll position: no section snapping (`scroll-snap-*` was removed from `html` / `.section`), no scroll-triggered entrances (the Motion `Reveal` wrapper and the `motion` dependency are gone) and no scroll-traced experience line. Francisco asked for this on 2026-10-20 because the scroll animation made the page hard to read. Do not reintroduce scroll-linked effects on `/` (ScrollTrigger, `whileInView`, scroll listeners that change content) without his explicit ask.
- Kept on purpose: the persistent WebGPU/CSS backdrop, the shooting stars, the hero name intro, the thin reading-progress bar and the nav band.

## Home experience constellation (src/components/ExperienceTrail.tsx)

- The Experience section renders `CV.experience` as a static constellation: one lit star per role joined by a fully drawn SVG line. Phones use a left rail; from 900px the cards alternate around a meandering central line.
- The line is measured on mount and on `ResizeObserver` / breakpoint change only, never on scroll. `check:portfolio` (`assertExperienceTrail`) checks there is no scroll state and that cards look the same wherever the viewport sits.

## Home worlds selector (src/components/OrbitSelector.tsx)

- Worlds are layered CSS, never WebGPU. Press-and-drag turns a world about any axis: `src/lib/worldSpin.ts` keeps a quaternion per world and the selector paints it as CSS variables (`--spin-roll`, `--spin-tilt`, `--spin-lon`, `--ring-open`). A drag never navigates or steps; touch keeps quick vertical swipes for page scroll (grab = horizontal move or a short hold); inertia is off under reduced motion.
- Entering a world (click, tap or Enter on the centred link) lands the puppy astronaut (`src/components/WorldLanding.tsx`, inline SVG + WAAPI, ~0.8 s), then zooms and pushes the route; reduced motion skips it for a short fade. Keep landing + zoom under ~1.4 s.
- The worlds carry no subtitle/tagline anywhere (selector, world pages, MCP, llms.txt). Copy, aria and identifiers say "world", never "planet". `check:portfolio` covers drag, landing and the removed copy (`landing-*` scenarios).

## Domain and SEO

- `src/lib/site.ts` is the only place that names the production origin (`CANONICAL_SITE_URL`, now `https://franprz.vercel.app`; `franprz.tech` is being registered: switch it there only once that domain serves the site). `metadataBase`, canonicals, robots, sitemap, JSON-LD, the /for-agents prompt and the CV contact line read it. The CV PDFs print it, so `src/lib/site.ts` is part of the CV source hash: after changing it, run `pnpm cv:pdf`.
- Every route sets its own `alternates.canonical` and `openGraph.url`; the root layout sets neither (a layout-level canonical leaked `/` into /for-agents). A route that sets `openGraph` lists `SITE_OG_IMAGE` (src/lib/seo.ts) again, because a child `openGraph` replaces the inherited one.
- The home page carries Person + WebSite JSON-LD (`src/lib/structuredData.ts`), built only from facts the page shows; no phone or street address.
- The home page has no featured projects block (removed 2026-10-20 at Francisco's request): after the worlds selector it goes straight to "Charlemos" (#contact). `n8n-nodes-timed-buffer` belongs to IAntropo (Francisco contributed): never feature or describe it as his own anywhere.
- The WebGPU backdrop is skipped entirely (no chunk download) under `prefers-reduced-motion: reduce`, Save-Data, or a coarse pointer below 768px (`shouldSkipScene` in src/lib/lite.ts); the CSS sky stays.

## Workflow

- Never push to `main`. Work on `feat/`, `fix/`, `chore/` or `agent/` branches and open a PR with What changes / Why / Impact / Validation.
- One concern per PR.
- English for code, comments, commits and docs. Commit format: `type: brief description`.
- Rebase onto `main` before merging; the PR must be mergeable with green checks.

## Agent skills

Web quality skills from [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) are vendored in [`.agents/skills/`](.agents/skills/README.md). Load the matching one before working on that area:

- Performance, bundle size, 3D/WebGPU cost: [`.agents/skills/performance/SKILL.md`](.agents/skills/performance/SKILL.md) and its [measurement workflow](.agents/skills/performance/references/MEASUREMENT.md)
- LCP / INP / CLS: [`.agents/skills/core-web-vitals/SKILL.md`](.agents/skills/core-web-vitals/SKILL.md)
- Accessibility: [`.agents/skills/accessibility/SKILL.md`](.agents/skills/accessibility/SKILL.md)
- SEO: [`.agents/skills/seo/SKILL.md`](.agents/skills/seo/SKILL.md)
- Best practices: [`.agents/skills/best-practices/SKILL.md`](.agents/skills/best-practices/SKILL.md)
- Full audit: [`.agents/skills/web-quality-audit/SKILL.md`](.agents/skills/web-quality-audit/SKILL.md)

Measure before and after (Lighthouse mobile on the production URL or a local `next start`) and report real numbers only.
