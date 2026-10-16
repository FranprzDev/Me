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

- Headings use **Space Grotesk** (OFL, `next/font/google` in the root layout, latin subset, variable weight, `display: swap`), exposed as `--font-heading` in `globals.css`; a zero-specificity `@media screen` rule gives every `h1`-`h4` that face. Body copy stays on the system UI stack and kickers/labels on `ui-monospace`. Use `var(--font-heading)` for any new display type; never hard-code Georgia or another serif.
- Exceptions on purpose: `/me` keeps its own editorial Fraunces / IBM Plex system, and the CV print layout (and so the PDFs) keeps Fraunces so the one-page A4 fit is unchanged.

## CV pages (/cv, /es/cv)

- Content: `src/content/cv/` is the single typed source (`CvVariant`, `CvLocale`, `CvSection` enums). `facts.ts` holds the real facts from Francisco's CVs; `variants.ts` only reorders and re-emphasises them. Never invent roles, dates, metrics or skills, and never publish a phone number or home address (email, GitHub, LinkedIn and portfolio URL only).
- Rendering: `src/components/cv/` (server components). Routes are static (`generateStaticParams`, `dynamicParams = false`). CV pages wear the portfolio chrome (site nav with the EN/ES switch linking to the counterpart page, cursor trail, a static CSS night-sky backdrop; no WebGPU layer). Keep the backdrop static: nothing may loop under the glass panels (no infinite CSS animations, no shooting stars), because any motion behind `backdrop-filter` re-rasters and re-blurs the whole viewport every frame (prod audit 2026-10-14: 12-23 fps idle on desktop, ~60% raster load on phones). `check:portfolio` fails on any infinite animation on a CV page. `cv.css` keeps two separate blocks: `@media screen` (the portfolio look: glass panels, Space Grotesk display (the site heading face), mono kickers, entrance motion only under `prefers-reduced-motion: no-preference`) and `@media print` (the clean light A4 résumé the PDFs are rendered from, with every piece of site chrome hidden). Never let screen styles leak into print. The Fraunces / IBM Plex faces are print-only and not preloaded.
- One page: every variant (EN and ES) must fit on ONE A4 page in print and in its PDF (Francisco's rule). `pnpm cv:pdf` and `check:portfolio` fail otherwise. To make room, prioritise per variant in `variants.ts` (drop the least relevant role, bullet or project for that role type, shorten wording without changing facts); never shrink body text below 9.5pt or squeeze margins below 10mm. The screen page shows the same content set.
- Index (/cv, /es/cv): each version is one glass tile that is itself the PDF download link (`download`, aria-label "Download <Version> CV (PDF)"); no inner buttons. The /cv/<variant> pages stay live. User-facing English says "CV", never "Résumé". The site nav has no CV item; the hero CTA downloads the generated Applied AI PDF in the page language (`src/lib/primaryCv.ts` on top of `cvPdfPath`, versioned `?v=`); /me and the MCP profile's `cv_pdf` use the same file. The old hand-committed `/cv/FranciscoPerez-AIEngineer.pdf` is gone and redirects to the English Applied AI PDF.
- PDFs: committed in `public/cv/files/`, rendered from the pages with Playwright. After changing anything in `src/content/cv/` or `src/components/cv/`, rebuild, start the server and run `PORTFOLIO_URL=http://localhost:3000 pnpm cv:pdf`, then commit `public/cv/files/`. They are not generated during `next build` because the build host (Vercel) has no browser. `check:portfolio` fails when `manifest.json`'s source hash no longer matches, so a stale PDF cannot ship. The manifest also records each file's content version; `cvPdfPath()` links `?v=<version>` everywhere (index cards, Download PDF button, MCP `pdf_url`) with a clean `download` filename, versioned URLs are cached `immutable` and bare URLs revalidate (`next.config.ts`), so a regenerated PDF is never served from cache.
- Language: the root layout renders `<html lang="es">`; on CV routes the content root carries the route's `lang` and the i18n provider sets `document.documentElement.lang` from the URL after hydration.

## MCP server and agent discovery (/api/mcp, /for-agents, agent card, llms.txt)

- `src/lib/mcp/tools.ts` is the single source of the tool names, summaries, server name/version and endpoint path; the route, the agent card, `/for-agents`, `/llms.txt` and the assistant prompt all read it. CV versions always come from `src/content/cv` (`CvVariant`); the profile title (role part of the primary CV headline) and the full CV's education come from there too, so the MCP never states a fact the published CV does not.
- The server is stateless Streamable HTTP with JSON responses. Keep the hardening in `src/app/api/mcp/route.ts`: CORS `*` on every response plus an `OPTIONS` preflight (`src/lib/mcp/http.ts`; public, read-only, no credentials), lenient `Accept` (JSON-only or missing is served), a 64 KiB body cap, `tools.listChanged: false`, `GET`/`DELETE` answer 405.
- Copy-paste configs on `/for-agents` (Claude Code command, `mcpServers` JSON, VS Code `servers` JSON, Inspector CLI) are built from the request host and checked by `check:agent`; never hard-code another host.
- Test with a real client before and after changes: `npx @modelcontextprotocol/inspector --cli <url>/api/mcp --transport http --method tools/list`, and `pnpm check:agent` (covers capabilities, invalid args, CORS, Accept, body cap, llms.txt and the configs).

## Home experience constellation (src/components/ExperienceTrail.tsx)

- The Experience section renders `CV.experience` as a constellation traced on scroll: an SVG line drawn by `stroke-dashoffset` (rAF-eased, stops when settled), one star per role, `data-state` = `upcoming` / `active` / `past` on each entry. Phones use a left rail; from 900px the cards alternate around a meandering central line.
- Per frame only the dash offset and the tip's `transform` change; layout is measured on resize / `ResizeObserver`, never per frame. Dimmed entries change colour and scale, never opacity, so axe contrast passes in every state.
- Reduced motion (and the server render) show the whole constellation drawn and every role lit; scroll does nothing then. `check:portfolio` covers both (`assertExperienceTrail`).

## Home worlds selector (src/components/OrbitSelector.tsx)

- Worlds are layered CSS, never WebGPU. Press-and-drag turns a world about any axis: `src/lib/worldSpin.ts` keeps a quaternion per world and the selector paints it as CSS variables (`--spin-roll`, `--spin-tilt`, `--spin-lon`, `--ring-open`). A drag never navigates or steps; touch keeps quick vertical swipes for page scroll (grab = horizontal move or a short hold); inertia is off under reduced motion.
- Entering a world (click, tap or Enter on the centred link) lands the puppy astronaut (`src/components/WorldLanding.tsx`, inline SVG + WAAPI, ~0.8 s), then zooms and pushes the route; reduced motion skips it for a short fade. Keep landing + zoom under ~1.4 s.
- The worlds carry no subtitle/tagline anywhere (selector, world pages, MCP, llms.txt). Copy, aria and identifiers say "world", never "planet". `check:portfolio` covers drag, landing and the removed copy (`landing-*` scenarios).

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
