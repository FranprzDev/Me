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

## CV pages (/cv, /es/cv)

- Content: `src/content/cv/` is the single typed source (`CvVariant`, `CvLocale`, `CvSection` enums). `facts.ts` holds the real facts from Francisco's CVs; `variants.ts` only reorders and re-emphasises them. Never invent roles, dates, metrics or skills, and never publish a phone number or home address (email, GitHub, LinkedIn and portfolio URL only).
- Rendering: `src/components/cv/` (server components, print CSS in `cv.css`). Routes are static (`generateStaticParams`, `dynamicParams = false`).
- PDFs: committed in `public/cv/files/`, rendered from the pages with Playwright. After changing anything in `src/content/cv/` or `src/components/cv/`, rebuild, start the server and run `PORTFOLIO_URL=http://localhost:3000 pnpm cv:pdf`, then commit `public/cv/files/`. They are not generated during `next build` because the build host (Vercel) has no browser. `check:portfolio` fails when `manifest.json`'s source hash no longer matches, so a stale PDF cannot ship.
- Language: the root layout renders `<html lang="es">`; on CV routes the content root carries the route's `lang` and the i18n provider sets `document.documentElement.lang` from the URL after hydration.

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
