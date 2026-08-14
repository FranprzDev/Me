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

## Estructura

- `src/app` - rutas, layout global y estilos
- `src/components` - secciones, navegación y escena 3D
- `src/data` - contenido del portfolio
- `src/lib` - i18n, scroll y utilidades
