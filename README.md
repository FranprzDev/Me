# Portfolio de Francisco Miguel Perez

Portfolio personal en Next.js con una estética espacial, secciones bilingües y una experiencia 3D ligera orientada a presentación profesional.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Motion
- React Three Fiber

## Desarrollo

Este proyecto usa pnpm como gestor de paquetes.

Para generar canonical, robots y sitemap con la URL pública, definí
`NEXT_PUBLIC_SITE_URL` en el entorno de build (por ejemplo,
`https://tu-dominio.com`).

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Calidad

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm check:shaders
pnpm build
pnpm exec playwright install chromium
pnpm start
```

En otra terminal, `pnpm check:portfolio` verifica las cinco rutas, ES/EN,
teclado, menú móvil, selección de mundos, CV, canonical, errores de navegador,
overflow y accesibilidad automatizada con axe. Incluye escenarios sin WebGPU,
con movimiento reducido, sin JavaScript, storage bloqueado y pantalla de 320px.
Guarda capturas en `artifacts/portfolio-quality/` (no se versionan).

Para otra URL: `PORTFOLIO_URL=http://localhost:3001 pnpm check:portfolio`.
Para revisar el render con GPU real en un entorno con pantalla:
`HEADFUL=1 pnpm check:portfolio` (desktop/móvil con render normal; los escenarios
sin efectos se ejecutan sólo sin ventanas). Los checks automatizados no reemplazan la
inspección visual ni una prueba en un teléfono físico.

GitHub Actions ejecuta lint, TypeScript, shaders, build y el chequeo de navegador
en cada PR. Vercel valida por separado el build de preview.

## Estructura

- `src/app` - rutas, layout global y estilos
- `src/components` - secciones, navegación y escena 3D
- `src/data` - contenido del portfolio
- `src/lib` - i18n, scroll y utilidades
