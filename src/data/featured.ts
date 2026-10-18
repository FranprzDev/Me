import type { Localized } from "./cv";

/** What a featured-project link opens; drives its label. */
export enum FeaturedLinkKind {
  Demo = "demo",
  Code = "code",
  Contest = "contest",
}

export interface FeaturedLink {
  kind: FeaturedLinkKind;
  href: string;
}

/**
 * A project case study for the home page. Every field comes from the project's
 * own README or from copy already published on this site (src/data/projects.ts):
 * `outcome` is only set when the result is already stated there. Never add
 * metrics, users or awards that those sources do not state.
 */
export interface FeaturedProject {
  /** Stable id, also the card's anchor (`#project-<id>`). */
  id: string;
  name: string;
  /** Context line: event, team or kind of project, and year. */
  context: Localized<string>;
  problem: Localized<string>;
  built: Localized<string>;
  stack: string[];
  outcome?: Localized<string>;
  links: FeaturedLink[];
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: "exogames",
    name: "ExoGames",
    context: {
      es: "NASA Space Apps Challenge 2024 · equipo La Banda de Marshall",
      en: "NASA Space Apps Challenge 2024 · team La Banda de Marshall",
    },
    problem: {
      es: "Enseñar exoplanetas a chicos de una forma distinta a la tradicional, que los mantenga atentos y con ganas de seguir.",
      en: "Teaching kids about exoplanets in a way that breaks from traditional methods and keeps them engaged.",
    },
    built: {
      es: "Una experiencia web interactiva en 3D, responsive y con assets optimizados para que los modelos y animaciones carguen rápido.",
      en: "An interactive 3D web experience, responsive and with optimized assets so the 3D models and animations load fast.",
    },
    stack: ["Astro", "React", "Three.js", "TypeScript"],
    outcome: {
      es: "Proyecto ganador a nivel nacional del NASA Space Apps Challenge 2024.",
      en: "National winning project of the NASA Space Apps Challenge 2024.",
    },
    links: [
      { kind: FeaturedLinkKind.Demo, href: "https://exogames.vercel.app" },
      { kind: FeaturedLinkKind.Code, href: "https://github.com/FranprzDev/NASASpaceApp-Marshall-Arg" },
    ],
  },
  {
    id: "donde-arde-argentina",
    name: "¿Dónde arde Argentina?",
    context: {
      es: "Contar con Datos 2026 (UdeSA × SSCyT Tucumán) · Historia visual",
      en: "Contar con Datos 2026 (UdeSA × SSCyT Tucumán) · Visual Story",
    },
    problem: {
      es: "Mostrar dónde y cuándo arde Argentina (2012–2025) en menos de 60 segundos, con cifras que cualquiera pueda verificar y reproducir.",
      en: "Showing where and when Argentina burns (2012–2025) in under 60 seconds, with figures anyone can verify and reproduce.",
    },
    built: {
      es: "Un video de visualización de datos generado íntegramente en código desde datos abiertos: mapa, animación, cifras y música. Ninguna cifra se tipea a mano: cada número sale de un dato con nombre y cada redondeo verbal tiene su assert, o el build falla.",
      en: "A data-visualization video generated entirely in code from open data: map, animation, figures and music. No number is typed by hand: each one comes from a named fact and every verbal rounding has an assert, or the build fails.",
    },
    stack: ["Rust", "fframes", "Python", "NASA FIRMS VIIRS", "MODIS", "Sentinel-2"],
    outcome: {
      es: "Presentado en el concurso. Sin resultado todavía.",
      en: "Submitted to the contest. No outcome yet.",
    },
    links: [{ kind: FeaturedLinkKind.Code, href: "https://github.com/FranprzDev/donde-arde-argentina" }],
  },
  {
    id: "proofy",
    name: "Proofy",
    context: {
      es: "Superteam Argentina × Colosseum (Solana) · octubre 2026, co-creado con Dylan",
      en: "Superteam Argentina × Colosseum (Solana) · October 2026, co-created with Dylan",
    },
    problem: {
      es: "En los contratos de software, entregar sin cobrar o pagar sin recibir lo acordado.",
      en: "In software contracts, delivering without getting paid, or paying without receiving the agreed work.",
    },
    built: {
      es: "Un agente de IA que convierte el alcance acordado en escenarios de prueba y revisa cada entrega contra la evidencia de CI/CD, y un escrow en Anchor que libera SOL por hito solo cuando esa evidencia se sostiene. Web en Next.js con Sign-In With Solana.",
      en: "An AI agent that turns the agreed scope into test scenarios and checks each delivery against CI/CD evidence, plus an Anchor escrow that releases SOL per milestone only when that evidence holds. Next.js web app with Sign-In With Solana.",
    },
    stack: ["Next.js", "TypeScript", "Python", "FastAPI", "LangGraph", "Rust", "Anchor", "Solana"],
    outcome: {
      es: "Prototipo funcional en devnet, sin auditar.",
      en: "Working prototype on devnet, not audited.",
    },
    links: [
      { kind: FeaturedLinkKind.Demo, href: "https://proofyai.vercel.app" },
      { kind: FeaturedLinkKind.Code, href: "https://github.com/FranprzDev/Proofy" },
      { kind: FeaturedLinkKind.Contest, href: "https://colosseum.com/arena/projects/proofy-1" },
    ],
  },
  {
    id: "scrapping-repuestos-uy-api",
    name: "Scrapping-Repuestos-UY-API",
    context: {
      es: "Proyecto personal · 2025 – en curso",
      en: "Personal project · 2025 – ongoing",
    },
    problem: {
      es: "Juntar los catálogos de repuestos de tiendas uruguayas que publican sus datos cada una a su manera, sin quedarse con productos sin precio o sin stock.",
      en: "Collecting spare-parts catalogs from Uruguayan stores that each publish their data differently, without keeping products that have no price or no stock.",
    },
    built: {
      es: "Una API en NestJS con estrategia híbrida por dominio: API nativa o HTTP + parseo HTML/JSON-LD primero y Playwright solo como fallback, un quality gate central, jobs asíncronos, scraping diario programado y migraciones versionadas.",
      en: "A NestJS API with a per-domain hybrid strategy: native API or HTTP + HTML/JSON-LD parsing first and Playwright only as a fallback, a central quality gate, async jobs, scheduled daily scraping and versioned migrations.",
    },
    stack: ["NestJS", "TypeScript", "Playwright", "Railway"],
    outcome: {
      es: "Cubre seis tiendas en su fase actual; persistencia en base de datos y cola externa todavía pendientes.",
      en: "Covers six stores in its current phase; database persistence and an external queue are still pending.",
    },
    links: [{ kind: FeaturedLinkKind.Code, href: "https://github.com/FranprzDev/Scrapping-Repuestos-UY-API" }],
  },
];
