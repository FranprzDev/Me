# Francisco Miguel Perez — Portfolio

Personal portfolio built with Next.js: a space-themed, bilingual (ES/EN) site
with a lightweight 3D experience aimed at professional presentation, plus a
public read-only MCP server so AI agents can query the same data.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Motion
- React Three Fiber
- Model Context Protocol TypeScript SDK (MCP server)

## Development

This project uses pnpm as its package manager.

To generate canonical URLs, robots and sitemap with the public URL, set
`NEXT_PUBLIC_SITE_URL` in the build environment (for example,
`https://your-domain.com`).

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## For AI agents (MCP)

`/api/mcp` is a stateless, read-only MCP server over Streamable HTTP. It only
accepts JSON-RPC over `POST` (`GET` and `DELETE` answer 405), keeps no session,
uses no LLM and no secrets, and reads the same static data in `src/data` that
the site renders. Tools (each accepts `language: "en" | "es"`, default `en`,
except `get_contact`):

- `get_profile` — name, title, location, summary, highlights and links
- `get_contact` — email, LinkedIn, GitHub and WhatsApp
- `get_experience` — roles, organizations, periods and stack, newest first
- `get_cv` — profile, experience, education and certifications, plus the PDF link
- `list_projects` — portfolio worlds with slug, title and page URL
- `get_project` — every entry of one world, by `slug`

The `/for-agents` page explains how to connect, and
`/.well-known/agent-card.json` points agents to `/api/mcp`. The former
in-browser recruiter assistant was removed; `/for-recruiters` now redirects
permanently to `/me`.

Quick check against a running server:

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Quality

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm check:shaders
pnpm build
pnpm exec playwright install chromium
pnpm start
```

In another terminal, `pnpm check:agent` verifies the agent-facing surface (home
link to `/for-agents`, the `/for-recruiters` redirect, the agent card and the
MCP `initialize` / `tools/list` / `tools/call` round trip), and
`pnpm check:portfolio` verifies the five routes, ES/EN, keyboard, mobile menu,
world selection, CV, canonical, browser errors, overflow and automated
accessibility with axe. It includes scenarios without WebGPU, with reduced
motion, without JavaScript, with blocked storage and on a 320px screen.
Screenshots are saved to `artifacts/portfolio-quality/` (not versioned).

For another URL: `PORTFOLIO_URL=http://localhost:3001 pnpm check:portfolio`.
To review rendering with a real GPU in an environment with a display:
`HEADFUL=1 pnpm check:portfolio` (desktop/mobile with normal rendering; the
no-effects scenarios run only headless). Automated checks do not replace visual
inspection or a test on a physical phone.

GitHub Actions runs lint, TypeScript, shaders, build and the browser checks on
every PR. Vercel validates the preview build separately.

## Structure

- `src/app` - routes, global layout and styles
- `src/app/api/mcp` - read-only MCP server
- `src/components` - sections, navigation and 3D scene
- `src/data` - portfolio content
- `src/lib` - i18n, scroll, MCP data views and utilities
