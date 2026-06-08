# Portfolio + UTN-FRT-MCP

Portfolio personal de **Francisco Miguel Perez** (Ing. en Sistemas de Información) con un
viaje 3D por scroll (Espacial → Japón Oriental → Brainrot) y el lanzamiento del
**UTN-FRT-MCP**: un servidor MCP gratuito para consultar apuntes de la UTN-FRT desde cualquier CLI.

Especificaciones completas: [`ESPECIFICACIONES.md`](./ESPECIFICACIONES.md).

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **React Three Fiber** + **drei** + **three** — escena 3D continua dirigida por scroll
- **motion** — animaciones de UI
- **mcp-handler** + **@modelcontextprotocol/sdk** — servidor MCP por HTTP
- **MiniSearch** — búsqueda full-text de apuntes
- **gray-matter** + **officeparser** (build) — indexado y extracción de texto

## Desarrollo
```bash
npm install
npm run dev          # genera el índice de apuntes y levanta http://localhost:3000
```

## Estructura
```
notes/<nivel>/<materia>/<archivos>   # apuntes (fuente de verdad)
scripts/build-notes-index.mjs        # indexador (md + extracción pdf/docx/xlsx/pptx)
src/data/cv.ts                       # CV (constante bilingüe ES/EN)
src/data/projects.ts                 # proyectos
src/data/notes-index.json            # índice generado (no editar a mano)
src/components/three/Scene.tsx       # viaje 3D
src/components/                       # secciones, nav, MCP
src/lib/notes.ts                     # loader + búsqueda
src/app/api/[transport]/route.ts     # endpoint MCP  ->  /api/mcp
```

## El MCP

Tools: `list_subjects`, `list_notes`, `get_note`, `search_notes`.

Conexión desde una CLI compatible:
```bash
claude mcp add --transport http utn-frt https://<tu-deploy>.vercel.app/api/mcp
```

### Agregar apuntes
1. Poné el archivo en `notes/<nivel>/<materia>/`.
2. Formatos: `.md` (texto inline), `.pdf` `.docx` `.xlsx` `.pptx` (texto extraído en build), `.jpg` `.png` (metadata).
3. Para binarios, opcionalmente agregá un sidecar `archivo.ext.meta.json` con `{ "title", "tags", "description", "updated" }`.
4. `npm run notes:index` (o `npm run dev`/`build`) regenera el índice.

## Deploy en Vercel (gratis)
1. Subí el repo a GitHub e importalo en Vercel (plan Hobby), **o** `vercel deploy`.
2. El `prebuild` genera el índice automáticamente.
3. (Recomendado) Definí la env var **`NEXT_PUBLIC_SITE_URL`** con la URL final
   para que el MCP devuelva URLs de descarga absolutas. Si no, usa `VERCEL_URL` automática.
4. Costo $0: assets estáticos + índice JSON empaquetado, sin base de datos.
