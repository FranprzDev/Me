# Agent skills

Vendored, read-only copies of third-party agent skills used when working on this repo.

| Skill | Use it for |
|-------|-----------|
| [`web-quality-audit`](web-quality-audit/SKILL.md) | Full Lighthouse-style review across every category |
| [`performance`](performance/SKILL.md) | Loading and runtime performance, bundle size, measurement workflow |
| [`core-web-vitals`](core-web-vitals/SKILL.md) | LCP, INP and CLS diagnosis and fixes |
| [`accessibility`](accessibility/SKILL.md) | WCAG 2.2 checks and patterns |
| [`seo`](seo/SKILL.md) | Crawlability, metadata, structured data |
| [`best-practices`](best-practices/SKILL.md) | Security headers, modern APIs, console hygiene |

## Source

- Repository: https://github.com/addyosmani/web-quality-skills
- Commit: `afa8da942115f2961fdbfa80807ea0b232ff6c00` (2026-08-24)
- License: MIT, see [`LICENSE-web-quality-skills`](LICENSE-web-quality-skills)
- Installed with the manual method documented upstream (`cp -r skills/* <agent skills dir>`), into `.agents/skills/`, the shared skills directory read by Codex, Cursor, Gemini CLI and other Agent Skills compatible tools.

## Updating

Do not edit these files in place. To update, copy `skills/*` from a newer upstream commit over this folder, bump the commit above, and open a `chore:` PR on its own.
