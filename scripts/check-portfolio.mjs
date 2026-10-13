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
      const pills = page.locator("#projects a.world-pill");
      assert.equal(await pills.count(), 4);
      assert.equal(await page.locator("#world-details .chip").count(), 0, "No decorative project chips");
      const worldCard = page.locator("#world-details");
      assert.equal(await worldCard.evaluate((el) => el.tagName), "A", "World card is a real link");
      for (let index = 0; index < 4; index++) {
        assert.equal(await pills.nth(index).getAttribute("href"), routes[index + 1], "World pill links straight to its world page");
      }
      for (let index = 0; index < 4; index++) {
        assert.equal(await worldCard.getAttribute("href"), routes[index + 1], "World card links to its world page");
        await page.getByRole("button", { name: "Siguiente planeta" }).click();
      }
      assert.equal(await worldCard.getAttribute("href"), routes[1], "World slider wraps");
      await page.getByRole("button", { name: "Planeta anterior" }).click();
      assert.equal(await worldCard.getAttribute("href"), routes[4]);
      assert.equal(await page.locator("#world-panel, .world-card__toggle, .world-card__close, #projects [aria-expanded]").count(), 0, "No inline expansion");
      for (const gone of ["Abrir página completa", "Tocá la tarjeta para cerrar", "Tocá la tarjeta para ver este mundo", "más en la ruta completa", "Explorar este mundo"]) {
        assert.equal(await page.locator("#projects").getByText(gone).count(), 0, `Worlds section never renders "${gone}"`);
      }
      assert.equal(await page.locator("#projects").getByText("Cerrar", { exact: true }).count(), 0, "Worlds section has no Close button");
      // A pill goes straight to its world.
      await Promise.all([page.waitForURL(`**${routes[2]}`), pills.nth(1).click()]);
      await page.goto(`${baseURL}/#projects`);
      await page.locator("#world-details").waitFor();
      // Enter on the focused card goes straight to the world.
      await page.locator("#projects").scrollIntoViewIfNeeded();
      while ((await worldCard.getAttribute("href")) !== routes[1]) await page.getByRole("button", { name: "Siguiente planeta" }).click();
      await worldCard.focus();
      await Promise.all([page.waitForURL(`**${routes[1]}`), page.keyboard.press("Enter")]);
      await page.locator(".story-back").waitFor();
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
      assert.equal(await page.locator(".trajectory .trajectory__node").count() > 1, true, "Scroll trajectory nodes");
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

    if (process.env.HEADFUL === "1") return;
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
