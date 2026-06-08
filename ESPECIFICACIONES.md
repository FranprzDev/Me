# Portfolio Dinámico + MCP de Apuntes UTN-FRT — Especificaciones

> Documento de especificaciones técnicas y de producto.
> Objetivo: portfolio personal **fachero, dinámico y con 3D**, más un **servidor MCP gratuito** que permita a estudiantes de la UTN-FRT acceder a mis apuntes desde su propia CLI.
> **Restricción dura: costo $0 para mí.** Todo debe correr en planes gratuitos.

---

## ✅ Estado de implementación (build inicial)

**Implementado y verificado** (build de producción ✔, lint limpio ✔, MCP probado end-to-end ✔):
- Proyecto Next.js 16 + React 19 + R3F scaffoldeado e integrado.
- Viaje 3D continuo por scroll: **Espacial → Japón → Brainrot** (canvas único, fuente
  única de umbrales en `src/lib/scroll.tsx`, alineado a las 7 secciones).
- Secciones: Hero, Sobre mí, Experiencia, Educación, **UTN-FRT-MCP**, Proyectos, Contacto, Footer.
- Contenido real desde `src/data/cv.ts` (bilingüe ES/EN, default español) + `projects.ts`.
- i18n con toggle ES/EN, nav con indicador de etapa + barra de progreso + menú móvil.
- Accesibilidad: `prefers-reduced-motion`, foco visible, contraste mejorado, `aria`.
- **MCP server** en `/api/mcp` con 4 tools (`list_subjects`, `list_notes`, `get_note`, `search_notes`).
- **Pipeline de apuntes**: indexador con extracción de texto multi-formato + MiniSearch.
- Revisado por 2 subagentes; hallazgos clave corregidos (umbrales unificados, slug/colisiones
  de ids, URLs absolutas vía `VERCEL_URL`, deps de build movidas a devDependencies, etc.).

**Pendiente (necesita input/tu acción):**
- Usuario de **GitHub** y **links reales** de proyectos (en `src/data/projects.ts`).
- **Validar extracción** con un binario real de cada tipo (hoy solo hay `.md` placeholder).
- **Deploy** a `*.vercel.app` (ver `README.md`) y setear `NEXT_PUBLIC_SITE_URL`.
- Cargar el **contenido real** de los apuntes en `notes/`.

---

## 1. Visión

Un portfolio que sorprenda apenas se entra: animaciones 3D, transiciones fluidas y una estética con personalidad. Como no me caso con una sola estética, el sitio **no tiene un solo tema fijo**: tiene un **selector de temas** que cambia toda la atmósfera visual en vivo.

Además, el sitio expone un **MCP server** documentado para que cualquier compañero de la UTN-FRT lo conecte a su CLI (Claude Code, Cursor, etc.) y consulte mis apuntes al instante, sin descargar nada.

### Principios
- **Cero costo** para el dueño (hosting, MCP y datos en free tier).
- **Performance primero**: 3D que no funda la batería ni el celular de gama baja (degradación elegante).
- **Contenido real**: experiencia profesional y educativa, no relleno.
- **Una sola decisión evitada**: temas intercambiables en vez de uno solo.

---

## 2. Viaje visual por scroll (Scroll-Driven Journey)

No hay selector de temas. La estética **muta a medida que el usuario baja**, formando un único viaje narrativo continuo. El scroll es la línea de tiempo. Un **único canvas 3D persistente** se transforma sin cortes ni recargas: las escenas se funden entre sí (cross-fade de paleta, niebla, partículas y geometría) según la posición del scroll.

### Arco narrativo (de arriba hacia abajo)

```
  ▲ inicio
  │
  ● 宇  ESPACIAL        — lo infinito y frío. Primer impacto.
  │      estrellas, nebulosa, planeta orbitando, shader de agujero negro
  │      paleta: azul profundo, violeta, cian neón, blanco estelar
  │
  ▼ (transición fluida: el espacio "aterriza" en la tierra)
  │
  ● 久  JAPÓN ORIENTAL  — lo terrenal y sereno. El corazón del sitio.
  │      torii flotante, pétalos de sakura, niebla, faroles, agua con reflejo
  │      paleta: negro tinta, rojo bermellón, crema washi, dorado (sumi-e)
  │
  ▼ (transición fluida: la calma se desestabiliza / glitchea)
  │
  ● 🧠 BRAINROT         — el caos final. Cierre con energía.
  │      objetos random girando, glitch, partículas absurdas, saturación
  │      paleta: verde lima, magenta, amarillo, ruido RGB
  ▼ fin
```

### Reglas
- **Una sola escena 3D viva** durante todo el scroll (no se desmonta entre etapas) → transiciones perfectamente fluidas y "seguimiento visual".
- La progresión se mapea al **scroll progress** (0 → 1): paleta, fog, intensidad de partículas y blending de geometrías se interpolan en función de ese valor.
- Las **zonas de transición** se solapan con el contenido (texto) para que el cambio de mood acompañe lo que se está leyendo.
- Respeta `prefers-reduced-motion`: en ese caso, en vez de animación continua se hace un cambio por pasos (snap) entre etapas y se bajan las partículas.
- En **móvil/gama baja**: misma progresión pero con geometría simplificada y menos partículas.

---

## 3. Stack técnico

### Frontend
- **Next.js (App Router)** — React, SSR/SSG, deploy gratis en Vercel.
- **TypeScript**.
- **React Three Fiber + Drei** — Three.js declarativo para el canvas 3D persistente.
- **@react-three/drei `ScrollControls`** — vincula el scroll al estado de la escena 3D.
- **Framer Motion** — transiciones de UI y reveal de texto al scrollear.
- **Tailwind CSS** + **shadcn/ui** — sistema de estilos y componentes.
- **Lenis** (opcional) — smooth scroll para suavizar el viaje.

> **Por qué Next.js y no Astro:** el sitio es un *canvas 3D continuo que muta con el scroll* — es decir, una sola gran app interactiva, no islas de HTML estático. La ventaja de peso de Astro aplica cuando la mayor parte es estática; acá casi todo es interactivo y el canvas debe sobrevivir entre secciones, lo que con un árbol React único es natural. El peso real lo pone Three.js, no el framework. (Si en el futuro se prefiere un 3D *por secciones* en vez de continuo, Astro + islas sería la mejor opción y se reevalúa.)

> Skills internas relevantes para la construcción: `frontend-design` (UI 3D/animada de alta calidad), `vercel:nextjs`, `vercel:shadcn`, `vercel:react-best-practices`.

### MCP Server
- **TypeScript MCP server** sobre **Vercel Functions** (Fluid Compute, Node.js), transporte **HTTP/SSE remoto** → cualquiera lo conecta por URL, sin instalar nada.
- Apuntes como **archivos Markdown versionados en el repo** (fuente de verdad, gratis, sin DB).
- Búsqueda full-text en memoria sobre los `.md` (no requiere base de datos pagada).

### Hosting y datos (todo free tier)
- **Vercel Hobby** — frontend + funciones MCP. Gratis.
- **Apuntes en el repo Git** — sin costo de storage.
- (Opcional futuro) **Vercel Blob** para PDFs/imágenes pesadas si hiciera falta.

---

## 4. Estructura del sitio (mapeada al viaje por scroll)

El contenido se distribuye sobre las tres etapas para que el mood acompañe lo que se lee:

**🌌 Etapa ESPACIAL (arriba)**
1. **Hero 3D** — nombre, rol, escena espacial, CTA ("Ver experiencia" / "Conectar MCP").
2. **Sobre mí** — bio corta con personalidad, sobre el fondo estelar.

**⛩️ Etapa JAPÓN ORIENTAL (medio)**
3. **Experiencia profesional** — timeline animado (empresa, rol, fechas, logros).
4. **Educación** — UTN-FRT y otros; timeline o tarjetas.
5. **Apuntes UTN-FRT + MCP** — sección destacada: qué es el MCP, cómo conectarlo, lista de materias/apuntes. (Ancla temática: "el saber/los apuntes" cae en la etapa serena.)

**🧠 Etapa BRAINROT (abajo)**
6. **Proyectos / Skills** — grid con hover 3D / tilt, energía caótica.
7. **Contacto** — email, GitHub, LinkedIn.
8. **Footer** — créditos, link al repo.

---

## 5. El MCP de Apuntes (detalle)

### Qué resuelve
Que un compañero escriba en su CLI algo como *"pasame el apunte de Sistemas Operativos sobre planificación"* y lo reciba al toque, sin navegar el sitio.

### Tipos de archivo soportados
Un apunte puede ser uno de estos formatos (y **no más que estos**):

| Tipo | Extensión | Cómo lo entrega el MCP |
|------|-----------|------------------------|
| Markdown | `.md` | **Contenido completo en texto** (inline en la respuesta). |
| PDF | `.pdf` | URL de descarga + (opcional) texto extraído para lectura/búsqueda. |
| Word | `.docx` | URL de descarga + (opcional) texto extraído. |
| Excel | `.xlsx` | URL de descarga + (opcional) texto/tabla extraída. |
| PowerPoint | `.pptx` | URL de descarga + (opcional) texto de slides extraído. |
| Imagen | `.jpg` / `.png` | URL directa de la imagen. |

- **`.md`** es el único que se devuelve como texto plano inline (es lo más útil en una CLI).
- Para binarios (`pdf/docx/xlsx/pptx/jpg/png`) el MCP devuelve **metadata + una URL pública** servida por el sitio, así el usuario lo abre/descarga. Nada de incrustar binarios gigantes en la respuesta.
- **Búsqueda**: indexa siempre `title`, `subject`, `tags` y descripción de todos los apuntes. Para `.md` indexa el cuerpo completo. Para `pdf/docx/xlsx/pptx`, extracción de texto **opcional** (mejora la búsqueda; se evalúa por costo/complejidad). Las imágenes se buscan solo por metadata.

### Tools expuestas por el MCP
- `list_subjects()` → lista materias disponibles.
- `list_notes(subject)` → lista apuntes de una materia (con `id`, `title`, `type`, `tags`).
- `get_note(id)` → para `.md` devuelve el contenido; para binarios devuelve metadata + URL de descarga.
- `search_notes(query)` → búsqueda full-text sobre el índice (cuerpo en `.md`, metadata en el resto).

### Organización de los apuntes (por nivel y materia)
Espeja la carrera: nivel → materia → archivos. (Ya generada la estructura base.)
```
/notes
  /1er-nivel
    /sistemas-operativos          ← (ejemplo, SO está en 2do)
      sistemas-operativos.md      ← placeholder con frontmatter
      apunte-clase-3.pdf
      cronograma.xlsx
      diagrama-estados.png
  /2do-nivel
    /sistemas-operativos
      sistemas-operativos.md
  ...
  _index.json   (autogenerado: id, nivel, materia, título, tipo, tags, updated, url, texto-extraído)
```
- Niveles creados: `1er-nivel`, `2do-nivel`, `3er-nivel`, `4to-nivel`, `5to-nivel` (32 materias).
- Cada materia arranca con un `.md` placeholder; se le agregan más archivos (pdf/docx/xlsx/pptx/jpg/png) según se carguen.
- Cada `.md` lleva frontmatter: `title`, `subject`, `tags`, `updated`.
- Cada **binario** lleva un sidecar `nombre.ext.meta.json` (o entrada en `_index.json`) con `title`, `subject`, `tags`, `updated`, `description` — porque un PDF/imagen no tiene frontmatter.
- Un script de build regenera `_index.json` recorriendo `/notes`.

### Cómo lo conecta el usuario final
Documentado en la sección 6 del sitio, ej.:
```bash
claude mcp add --transport http apuntes-utn https://<mi-dominio>/api/mcp
```
(URL real definida al desplegar.)

### Costo
$0: las funciones MCP corren en Vercel Hobby; los apuntes (incluidos los binarios) viven en el repo y se sirven como estáticos. Sin base de datos paga.

> **Nota de tamaño:** si se acumulan muchos PDFs/imágenes pesadas y el repo crece demasiado, se migran esos binarios a **Vercel Blob** (tiene free tier) manteniendo el resto igual. Para el volumen típico de apuntes, el repo alcanza.

---

## 6. Performance y accesibilidad

- **Lazy load** de las escenas 3D; el contenido textual carga primero (SEO + velocidad).
- **Detección de dispositivo**: en móvil/gama baja, menos partículas y geometría más simple.
- `prefers-reduced-motion` respetado.
- Contraste AA en textos sobre fondos 3D.
- SEO: metadata, Open Graph, sitemap.

---

## 7. Roadmap de implementación

1. **Scaffold** Next.js + Tailwind + shadcn + R3F.
2. **Canvas 3D persistente + ScrollControls** (motor del viaje, scroll progress 0→1).
3. **Etapa Espacial** (hero) con degradación móvil.
4. **Transiciones e interpolación** entre etapas (paleta/fog/partículas mapeadas al scroll).
5. **Etapas Japón y Brainrot** + reveal de texto por scroll.
6. **Secciones de contenido** (experiencia, educación, proyectos) con datos reales.
7. **i18n ES/EN** (default `es`, toggle `en`) cableado desde `data/cv.ts`.
8. **MCP server** + indexado multi-formato (con extracción de texto) + `_index.json` + tools + deploy.
9. **Sección "Apuntes + MCP"** con instrucciones de conexión.
10. **Pulido**: animaciones, SEO, accesibilidad, deploy final a `*.vercel.app`.

---

## 8. Datos del dueño (ya cargados)

- [x] **Nombre y rol**: Francisco Miguel Perez — Ing. en Sistemas de Información.
- [x] **Experiencia / educación / certificaciones**: cargadas en `data/cv.ts` (fuente de verdad, bilingüe ES/EN, fiel al CV en PDF).
- [x] **Contacto**: `franciscoperezdeveloper@gmail.com`, LinkedIn `franprzdev`. (GitHub: pendiente de confirmar usuario.)
- [x] **Apuntes iniciales**: estructura `notes/<nivel>/<materia>/<materia>.md` generada a partir de la carrera (niveles 1 a 5). 32 materias con `.md` placeholder + frontmatter.
- [x] **Dominio**: subdominio gratis `*.vercel.app`.
- [ ] **GitHub username** (para link en contacto).
- [ ] **Proyectos destacados** a mostrar (NASA Space Apps y otros): nombre, descripción, link, stack.

### Fuentes de verdad del contenido
- `data/cv.ts` → toda la info personal/profesional/educativa (constante tipada, ES/EN).
- `notes/` → apuntes UTN-FRT, organizados por nivel y materia (alimentan el MCP).

---

## 9. Decisiones (confirmadas)

- **Framework**: ✅ Next.js + R3F (canvas 3D continuo).
- **Extracción de texto de binarios** (pdf/docx/xlsx/pptx): ✅ **desde el inicio** — es parte del core de la búsqueda del MCP, no una mejora opcional. Las imágenes (jpg/png) se indexan solo por metadata.
- **Sonido ambiente**: ✅ **No** (por ahora). Se puede sumar más adelante.
- **Idioma del sitio**: ✅ **Bilingüe ES/EN, principalmente español** (default `es`, toggle a `en`).
- **Dominio**: ✅ Subdominio gratis `*.vercel.app`.

### Implicancia de "extracción de texto desde el inicio"
El pipeline de indexado del MCP debe parsear, al generar `_index.json`:
- `.md` → cuerpo completo (ya es texto).
- `.pdf` → extracción de texto (ej. `pdf-parse` / `unpdf`).
- `.docx` → extracción de texto (ej. `mammoth`).
- `.xlsx` → texto/celdas (ej. `xlsx`/`sheetjs`).
- `.pptx` → texto de slides (ej. parser de `pptx`).
- `.jpg`/`.png` → solo metadata (sin OCR por ahora).

El texto extraído se guarda en el índice de búsqueda (no se re-extrae en cada request → costo $0 en runtime).
