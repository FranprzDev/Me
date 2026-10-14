import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseURL = process.env.PORTFOLIO_URL || "http://localhost:3000";
const output = `artifacts/portfolio-quality/${process.env.HEADFUL === "1" ? "headful" : "headless"}`;
const routes = ["/", "/hackathons", "/teaching", "/projects", "/education"];

async function checkPage(page, route, name) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  try {
    const response = await page.goto(`${baseURL}${route}`);
    assert.equal(response.status(), 200, `${name}: ${route}`);
    await page.locator("h1").waitFor();
    await page.waitForTimeout(2000);
    if (process.env.HEADFUL === "1") {
      await page.locator("[data-scene-root] canvas").waitFor({ state: "attached" });
      assert.equal(await page.locator("[data-scene-root] canvas").evaluate((el) => el.width > 0 && el.height > 0), true, `${name}: 3D background ${route}`);
    }
    assert.equal(await page.locator("h1").count(), 1, "One main heading");
    assert.equal(await page.locator("main#main-content").count(), 1, "Skip-link target");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: horizontal overflow`);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = page.viewportSize().height * 0.7;
    for (let top = 0; top < height; top += step) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
    if (name !== "no-javascript") {
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      assert.deepEqual(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), [], `${name}: accessibility ${route}`);
    }
    await page.screenshot({ path: `${output}/${name}-${route.slice(1) || "home"}.png`, fullPage: true });
    if (route === "/") {
      for (const id of ["top", "projects", "contact"]) {
        await page.evaluate((section) => window.scrollTo({ top: document.getElementById(section).offsetTop - 80, behavior: "instant" }), id);
        await page.waitForTimeout(700);
        await page.screenshot({ path: `${output}/${name}-home-${id}.png` });
      }
    }
    assert.deepEqual(errors, [], `${name}: browser errors ${route}`);
    console.log(`PASS ${name} ${route}`);
  } finally {
    page.off("pageerror", onError);
  }
}

/** Vehicle each world sends the visitor in with (WORLD_FLIGHTS in src/lib/worldFlight.ts). */
const VEHICLE_BY_ROUTE = { "/hackathons": "ufo", "/teaching": "paper-plane", "/projects": "hammer", "/education": "book" };

/** Records every world-entry flight overlay that mounts (it lives well under a second). */
function recordFlights() {
  window.__flights = [];
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || !node.matches("[data-world-flight]")) continue;
        const entry = { vehicle: node.dataset.worldFlight, world: node.dataset.world, path: node.dataset.path, overflow: null };
        window.__flights.push(entry);
        setTimeout(() => {
          entry.overflow = document.documentElement.scrollWidth > innerWidth;
        }, 200);
      }
    }
  }).observe(document, { childList: true, subtree: true });
}

/** Opens home on the selector, waits for the idle work (vehicle chunk, phase), then enters `route` with Enter. */
async function enterWorld(page, route) {
  const phase = page.waitForResponse((response) => response.url().endsWith("/api/geo-phase"), { timeout: 8000 }).catch(() => null);
  await page.goto(`${baseURL}/#projects`);
  await phase;
  await page.waitForTimeout(300);
  const card = page.locator("#world-details");
  await card.focus();
  while ((await card.getAttribute("href")) !== route) await page.keyboard.press("ArrowRight");
  await card.focus();
  await Promise.all([page.waitForURL(`**${route}`), page.keyboard.press("Enter")]);
  await page.waitForFunction(() => document.querySelector("[data-world-flight]") === null, null, { timeout: 2000 });
  await page.locator("h1").waitFor();
  return page.evaluate(() => window.__flights);
}

/** Scenario + page being checked, reported with any failure. */
const progress = { scenario: "", page: null, logs: [] };

/** Adds the scenario and the page state to a failure, while the page is still open. */
async function describeFailure(error) {
  if (!progress.page || progress.page.isClosed()) return;
  const where = await progress.page
    .evaluate(() => {
      const el = document.querySelector(".story-back");
      const style = el ? getComputedStyle(el) : null;
      const box = el?.getBoundingClientRect();
      return {
        url: location.href,
        h1: document.querySelector("h1")?.textContent,
        back: el ? `opacity=${style.opacity} visibility=${style.visibility} display=${style.display} box=${Math.round(box.width)}x${Math.round(box.height)}@${Math.round(box.top)}` : "missing",
      };
    })
    .catch((e) => ({ evalError: String(e) }));
  error.message = `[${progress.scenario}] ${JSON.stringify(where)}\nlogs: ${progress.logs.slice(-6).join(" | ")}\n${error.message}`;
}

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: process.env.HEADFUL !== "1" });
  try {
    const scenarios = [
      ["desktop", { viewport: { width: 1440, height: 900 } }, false],
      ["mobile", devices["iPhone 13"], false],
      ["no-webgpu", { viewport: { width: 1440, height: 900 } }, true],
      ["reduced-motion", { ...devices["iPhone 13"], reducedMotion: "reduce" }, true],
    ];
    for (const [name, options, fallback] of scenarios.filter(([, , fallback]) => process.env.HEADFUL !== "1" || !fallback)) {
      const context = await browser.newContext(options);
      await context.addInitScript(recordFlights);
      if (fallback) await context.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }));
      const page = await context.newPage();
      progress.scenario = name;
      progress.page = page;
      progress.logs = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") progress.logs.push(msg.text().slice(0, 400));
      });
      page.on("pageerror", (err) => progress.logs.push(`pageerror: ${String(err.stack ?? err).slice(0, 600)}`));
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(15000);
      for (const route of routes) {
        await checkPage(page, route, name);
        await page.getByRole("button", { name: "Cambiar a inglés" }).click();
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        assert.equal(await page.getByRole("button", { name: "Switch to Spanish" }).count(), 1);
        await page.getByRole("button", { name: "Switch to Spanish" }).click();
      }
      if (fallback) {
        // Without a WebGPU adapter the 3D chunk is never downloaded or mounted.
        assert.equal(await page.locator("[data-scene-root]").count(), 0, `${name}: no 3D backdrop without WebGPU`);
      }
      await page.goto(baseURL);
      assert.deepEqual(await page.evaluate(() => ["/hackathons", "/projects"].map((href) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        document.body.append(anchor);
        let intercepted;
        anchor.addEventListener("click", (event) => {
          intercepted = event.defaultPrevented;
          event.preventDefault();
        });
        anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        anchor.remove();
        return intercepted;
      })), [false, false], "Warp never intercepts rapid navigation");
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
      if (options.isMobile) {
        await page.getByRole("button", { name: "Abrir menú" }).click();
        assert.equal(await page.evaluate(() => document.activeElement.closest("#mobile-menu") !== null), true);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#mobile-menu").count(), 0);
        assert.equal(await page.getByRole("button", { name: "Abrir menú" }).evaluate((el) => el === document.activeElement), true);
        await page.getByRole("button", { name: "Abrir menú" }).click();
        await page.locator("#mobile-menu").getByRole("link", { name: "Proyectos" }).click();
        assert.equal(await page.locator("#mobile-menu").count(), 0);
      } else {
        await page.locator("nav").getByRole("link", { name: "Proyectos", exact: true }).first().click();
      }
      await page.waitForTimeout(1200);
      assert.equal(new URL(page.url()).hash, "#projects");
      const slots = page.locator("#projects .orbit-select__slot");
      assert.equal(await slots.count(), 4, "Four items in the system");
      // Solar layout: one item centred and large, one visible on each side of
      // the viewport, one smaller at the back; never a horizontal scrollbar.
      await page.waitForTimeout(900);
      const layout = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const boxes = {};
        for (const slot of document.querySelectorAll("#projects .orbit-select__slot")) {
          const r = slot.querySelector(".orbit-select__orb").getBoundingClientRect();
          boxes[slot.dataset.slot] = { cx: r.left + r.width / 2, w: r.width, left: r.left, right: r.right };
        }
        return { vw, boxes, scrollW: document.documentElement.scrollWidth };
      });
      const { vw, boxes } = layout;
      assert.ok(Math.abs(boxes.center.cx - vw / 2) < 4, "Focused item is centred");
      assert.ok(boxes.left.cx < vw * 0.25 && boxes.left.right > 8, "One item visible on the left");
      assert.ok(boxes.right.cx > vw * 0.75 && boxes.right.left < vw - 8, "One item visible on the right");
      assert.ok(boxes.center.w > boxes.left.w && boxes.left.w > boxes.back.w, "Depth: centre > sides > back");
      assert.ok(layout.scrollW <= vw, "No horizontal scroll");
      assert.equal(await page.locator("#projects h2").textContent(), "Construir cosas que importan.");
      assert.equal(await page.getByText("Hackathones bajo presión").count(), 0, "Removed hackathons tagline");
      assert.equal(await page.getByText(/Elegí un mundo y descubrí/).count(), 0, "Removed the section subtitle");
      assert.equal(await page.getByText("Desarrollo de producto").count(), 0, "Hero no longer says 'Desarrollo de producto'");
      assert.equal(await page.locator("#top").getByText(/AI Applied Engineer/).count(), 1, "Hero role is AI Applied Engineer");
      assert.equal(await page.locator("#projects").evaluate((el) => /planet/i.test(el.outerHTML)), false, "No 'planet' wording in the selector markup");
      const worldCard = page.locator("#world-details");
      assert.equal(await worldCard.evaluate((el) => el.tagName), "A", "Front item is a real link");
      assert.equal(await page.locator("#projects .orbit-select__controls, #projects .orbit-select__count").count(), 0, "No controls row or counter under the selector");
      assert.equal(await page.locator("#projects").getByRole("button", { name: /^(Siguiente|Anterior): / }).count(), 0, "No prev / next buttons");
      assert.equal(await page.locator("#projects").getByRole("link", { name: "Entrar", exact: true }).count(), 0, "No separate Enter pill");
      // Arrow keys rotate the orbit and keep focus on the new centred item.
      await worldCard.focus();
      for (let index = 0; index < 4; index++) {
        assert.equal(await worldCard.getAttribute("href"), routes[index + 1], "Front item links to its world page");
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(() => document.activeElement?.id === "world-details", null, { timeout: 2000 });
      }
      assert.equal(await worldCard.getAttribute("href"), routes[1], "Orbit wraps");
      await page.keyboard.press("ArrowLeft");
      assert.equal(await worldCard.getAttribute("href"), routes[4], "ArrowLeft brings the previous item forward");
      await page.keyboard.press("ArrowRight");
      assert.equal(await worldCard.getAttribute("href"), routes[1], "ArrowRight brings the next item forward");
      // An outer item is a button that brings that exact item to the centre.
      const sideButton = page.locator('#projects .orbit-select__slot[data-slot="right"] button');
      const sideName = (await sideButton.getAttribute("aria-label")).replace(/^Traer al centro: /, "");
      await sideButton.click();
      assert.equal(await worldCard.getAttribute("href"), routes[2], "Clicking the right item brings it to the centre");
      assert.equal(await worldCard.getAttribute("aria-label"), `Entrar: ${sideName}`, "The clicked item is the one centred");
      await page.locator('#projects .orbit-select__slot[data-slot="left"] button').click();
      assert.equal(await worldCard.getAttribute("href"), routes[1], "Clicking the left item brings it to the centre");
      assert.equal(await page.locator("#world-panel, .world-card__toggle, .world-card__close, #projects [aria-expanded]").count(), 0, "No inline expansion");
      for (const gone of ["Abrir página completa", "Tocá la tarjeta para cerrar", "Tocá la tarjeta para ver este mundo", "más en la ruta completa", "Explorar este mundo"]) {
        assert.equal(await page.locator("#projects").getByText(gone).count(), 0, `Worlds section never renders "${gone}"`);
      }
      assert.equal(await page.locator("#projects").getByText("Cerrar", { exact: true }).count(), 0, "Worlds section has no Close button");
      // Clicking the centred world goes to its page.
      const focusedHref = await worldCard.getAttribute("href");
      await Promise.all([page.waitForURL(`**${focusedHref}`), worldCard.click()]);
      await page.goto(`${baseURL}/#projects`);
      await page.locator("#world-details").waitFor();
      // Enter on the focused item zooms in and goes straight to the world.
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await worldCard.focus();
      while ((await worldCard.getAttribute("href")) !== routes[1]) await page.keyboard.press("ArrowRight");
      await worldCard.focus();
      await Promise.all([page.waitForURL(`**${routes[1]}`), page.keyboard.press("Enter")]);
      await page.locator(".story-back").waitFor();
      if (name === "reduced-motion") assert.deepEqual(await page.evaluate(() => window.__flights), [], "Reduced motion: no world-entry flight, instant navigation");
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader never replays on client navigation");
      await page.locator(".story-back").click();
      await page.waitForURL((url) => new URL(url).pathname === "/" && new URL(url).hash.startsWith("#projects"));
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader never replays going back home");
      await page.reload();
      await page.waitForTimeout(400);
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader shows once per browser session");
      const heading = page.locator("#contact h2");
      assert.equal(await heading.count(), 1, "Contact always has a semantic heading");
      if (fallback || options.isMobile) assert.equal(await heading.evaluate((el) => el.getBoundingClientRect().width > 100), true, "Contact has a visible DOM heading without the 3D title");
      const download = await page.locator("a[download]").getAttribute("href");
      const cv = await page.request.get(`${baseURL}${download}`);
      assert.equal(cv.status(), 200);
      assert.match(cv.headers()["content-type"], /pdf/);
      assert.equal((await cv.body()).subarray(0, 4).toString(), "%PDF");
      await page.goto(`${baseURL}/hackathons`);
      assert.equal(await page.locator("h1").textContent(), "Ideas contra el reloj.");
      assert.equal(await page.locator("#arena-missions-title").textContent(), "Voy a hackathones por amor al arte");
      for (const gone of ["HACKATHONS · TRABAJO EN EQUIPO · TUCUMÁN", "Hackathones bajo presión", "Espacios donde el tiempo, el equipo", "Sin ideas cerradas"]) {
        assert.equal(await page.getByText(gone).count(), 0, `Hackathons no longer shows "${gone}"`);
      }
      assert.equal(await page.locator(".hud-stats").count(), 0, "Hackathons stats are gone");
      assert.equal(await page.getByText("Si hay comida gratis, llámame.").count(), 1);
      const missionYears = await page.locator(".mission__meta span").allTextContents();
      assert.deepEqual(missionYears, [...missionYears].sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4))), "Hackathons run oldest to newest");
      assert.deepEqual(await page.locator(".mission-rail h3").allTextContents(), [
        "BeeAgro",
        "Hackathon n8n — Vortex IT",
        "Youth Hackathon 2025 — UNESCO",
        "Proofy — Superteam Argentina × Colosseum (Solana)",
        "Contar con Datos 2026 — UdeSA × SSCyT Tucumán",
      ], "Hackathon entries in chronological order");
      await page.goto(`${baseURL}/teaching`);
      assert.equal(await page.locator("h1").textContent(), "Cursos dictados");
      for (const gone of ["ENSEÑAR · ACOMPAÑAR · COMPARTIR", "Espacios de formación práctica", "El aula sigue abierta"]) {
        assert.equal(await page.getByText(gone).count(), 0, `Teaching no longer shows "${gone}"`);
      }
      assert.equal(await page.locator(".aula-book h3", { hasText: "platzi-hydratation-demo" }).count(), 1, "Platzi demo entry");
      await page.goto(`${baseURL}/projects`);
      assert.equal(await page.locator(".atlas-row").count(), 7);
      assert.equal(await page.locator(".atlas-specs, .atlas-category").count(), 0, "Projects page is one short catalogue");
      const projectYears = await page.locator(".atlas-row__year").allTextContents();
      assert.deepEqual(projectYears, [...projectYears].sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4))), "Projects run oldest to newest");
      await page.goto(`${baseURL}/education`);
      assert.equal(await page.locator("h1").textContent(), "Always Exploring");
      for (const gone of ["BITÁCORA DE EXPLORACIÓN", "26°49′S", "RUTA ACTIVA", "La exploración sigue", "El camino hacia un nuevo mundo"]) {
        assert.equal(await page.getByText(gone).count(), 0, `Education no longer shows "${gone}"`);
      }
      assert.equal(await page.locator(".entry-index a").count() > 1, true, "On-this-page index entries");
      assert.equal(await page.locator(".planet-nav__orbit a[aria-current='page']").count(), 1, "World dots mark the current world");
      // Fixed header: transparent at the top, solid band once the page scrolls.
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector(".site-nav")?.hasAttribute("data-scrolled"));
      // The band fades in; wait for the end of the transition, then check it is opaque.
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".site-nav"), "::before").opacity === "1");
      if (options.isMobile) {
        assert.equal(await page.locator(".site-nav").evaluate((el) => getComputedStyle(el, "::before").backgroundColor.startsWith("rgb(")), true, "Header band is a solid colour on touch screens");
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      for (const [from, to] of [["/curso-n8n", "/teaching"], ["/university", "/education"]]) {
        const redirect = await page.request.get(`${baseURL}${from}`, { maxRedirects: 0 });
        assert.equal(redirect.status(), 308, `${from} redirects permanently`);
        assert.equal(new URL(redirect.headers().location, baseURL).pathname, to);
      }
      for (const route of routes.slice(1)) {
        await page.goto(`${baseURL}${route}`);
        assert.equal(new URL(await page.locator("link[rel='canonical']").getAttribute("href")).pathname, route);
        assert.equal(await page.locator(".story-back").textContent(), "← Volver al universo");
        assert.equal(await page.getByText(/órbita/).count(), 0, "No 'órbita' copy on world pages");
        await page.locator(".story-back").click();
        await page.waitForURL((url) => new URL(url).pathname === "/" && new URL(url).hash.startsWith("#projects"));
      }
      if (name === "reduced-motion") {
        assert.equal(await page.locator(".hero-letter").first().evaluate((el) => getComputedStyle(el).transform), "none");
        assert.equal(await page.locator(".star-aura-layer").evaluate((el) => el.childElementCount), 0);
      }
      await context.close();
      console.log(`PASS ${name} navigation, keyboard, CV and metadata`);
    }

    // World-entry vehicles: each world flies its own vehicle in over the jump;
    // the overlay never scrolls sideways and is gone once the world is shown.
    for (const [name, options, worlds] of [
      ["vehicles-desktop", { viewport: { width: 1440, height: 900 } }, routes.slice(1)],
      ["vehicles-mobile", { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }, ["/hackathons"]],
    ]) {
      const context = await browser.newContext(options);
      await context.addInitScript(recordFlights);
      const page = await context.newPage();
      progress.scenario = name;
      progress.page = page;
      page.setDefaultTimeout(15000);
      for (const route of worlds) {
        const flights = await enterWorld(page, route);
        assert.equal(flights.length, 1, `${name}: one flight entering ${route}`);
        assert.equal(flights[0].vehicle, VEHICLE_BY_ROUTE[route], `${name}: ${route} flies its own vehicle`);
        assert.equal(flights[0].world, route.slice(1));
        assert.equal(flights[0].overflow, false, `${name}: no horizontal overflow mid-flight`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: no horizontal overflow after ${route}`);
      }
      await context.close();
      console.log(`PASS ${name} world-entry vehicles`);
    }

    // Country phase: φ = ISO 3166-1 numeric code mod 360 degrees, 0 when unknown.
    {
      const context = await browser.newContext();
      for (const [country, degrees] of [["AR", 32], ["ar", 32], ["US", 120], ["JP", 32], ["BR", 76], ["XX", 0], ["", 0], [null, 0]]) {
        const response = await context.request.get(`${baseURL}/api/geo-phase`, { headers: country === null ? {} : { "x-vercel-ip-country": country } });
        assert.equal(response.status(), 200);
        assert.match(response.headers()["cache-control"], /no-store/, "Phase is never cached across visitors");
        assert.deepEqual(await response.json(), { phaseDeg: degrees }, `Country ${country} → ${degrees}°`);
      }
      await context.close();
      // Two phases fly visibly different paths into the same world.
      const paths = [];
      for (const phaseDeg of [0, 120]) {
        const phased = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await phased.addInitScript(recordFlights);
        await phased.route("**/api/geo-phase", (route) => route.fulfill({ json: { phaseDeg }, headers: { "cache-control": "private, no-store" } }));
        const flights = await enterWorld(await phased.newPage(), "/hackathons");
        assert.equal(flights.length, 1, `Flight with phase ${phaseDeg}°`);
        paths.push(flights[0].path);
        await phased.close();
      }
      assert.notEqual(paths[0], paths[1], `Different phases give different flight paths (${paths.join(" vs ")})`);
      console.log("PASS country phase mapping and phased paths");
    }

    if (process.env.HEADFUL === "1") return;
    // /for-agents: lunar landing page with one-click assistant launchers.
    for (const [name, options] of [
      ["agents-desktop", { viewport: { width: 1440, height: 900 } }],
      ["agents-mobile", devices["iPhone 13"]],
    ]) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      progress.scenario = name;
      progress.page = page;
      page.setDefaultTimeout(15000);
      await checkPage(page, "/for-agents", name);
      for (const [label, prefix] of [["Open in ChatGPT", "https://chatgpt.com/?q="], ["Open in Claude", "https://claude.ai/new?q="]]) {
        const link = page.getByRole("link", { name: new RegExp(`^${label}`) });
        assert.equal(await link.count(), 1, `${name}: ${label} button`);
        const href = await link.getAttribute("href");
        assert.ok(href.startsWith(prefix), `${label} uses ${prefix}`);
        assert.match(decodeURIComponent(href.slice(prefix.length)), /https:\/\/me-pink-ten\.vercel\.app\/api\/mcp/, `${label} prompt points at the MCP server`);
        assert.equal(await link.getAttribute("target"), "_blank");
        assert.match(await link.getAttribute("rel"), /noopener/);
      }
      assert.equal(await page.getByRole("button", { name: "Copy prompt" }).count(), 1, "Copy-prompt fallback");
      assert.equal(await page.locator("main pre").count() >= 4, true, "Prompt and connector snippets are rendered");
      assert.equal(await page.locator("main").evaluate((el) => /planet/i.test(el.outerHTML)), false, "No 'planet' wording on /for-agents");
      assert.equal(await page.locator("main").evaluate((el) => /CH-0\d \/\//.test(el.outerHTML)), false, "No channel labels (CH-0x //) on /for-agents panels");
      await context.close();
    }
    for (const [name, options] of [
      ["small-mobile", { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true }],
      ["no-javascript", { javaScriptEnabled: false }],
      ["blocked-storage", {}],
    ]) {
      const context = await browser.newContext(options);
      if (name === "blocked-storage") await context.addInitScript(() => {
        Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); };
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(15000);
      await checkPage(page, "/", name);
      if (name === "blocked-storage") {
        await page.getByRole("button", { name: "Cambiar a inglés" }).click();
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
      }
      await context.close();
    }
  } catch (error) {
    await describeFailure(error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  // Surface the failing assertion as a GitHub annotation (visible without log access).
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=check-portfolio::${String(error?.message ?? error).replace(/\r?\n/g, "%0A").slice(0, 3000)}`);
  process.exitCode = 1;
});
