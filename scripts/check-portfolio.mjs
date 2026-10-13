import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseURL = process.env.PORTFOLIO_URL || "http://localhost:3000";
const output = `artifacts/portfolio-quality/${process.env.HEADFUL === "1" ? "headful" : "headless"}`;
const routes = ["/", "/hackathons", "/curso-n8n", "/projects", "/university"];

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
        await page.getByRole("link", { name: "Explorar mi trabajo", exact: false }).click();
      }
      await page.waitForTimeout(1200);
      assert.equal(new URL(page.url()).hash, "#projects");
      const selectors = page.locator("button[aria-controls='world-details']");
      assert.equal(await selectors.count(), 4);
      assert.equal(await page.locator("#world-details .chip").count(), 0, "No decorative project chips");
      for (let index = 0; index < 4; index++) {
        await selectors.nth(index).click();
        assert.equal(await selectors.nth(index).getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator("#world-details a").first().getAttribute("href"), routes[index + 1]);
      }
      await page.getByRole("button", { name: "Siguiente planeta" }).click();
      assert.equal(await selectors.first().getAttribute("aria-pressed"), "true", "World selector wraps");
      await page.getByRole("button", { name: "Planeta anterior" }).click();
      assert.equal(await selectors.last().getAttribute("aria-pressed"), "true");
      const heading = page.locator("#contact h2");
      assert.equal(await heading.count(), 1, "Contact always has a semantic heading");
      if (fallback || options.isMobile) assert.equal(await heading.evaluate((el) => el.getBoundingClientRect().width > 100), true, "Contact has a visible DOM heading without the 3D title");
      const download = await page.locator("a[download]").getAttribute("href");
      const cv = await page.request.get(`${baseURL}${download}`);
      assert.equal(cv.status(), 200);
      assert.match(cv.headers()["content-type"], /pdf/);
      assert.equal((await cv.body()).subarray(0, 4).toString(), "%PDF");
      for (const route of routes.slice(1)) {
        await page.goto(`${baseURL}${route}`);
        assert.equal(new URL(await page.locator("link[rel='canonical']").getAttribute("href")).pathname, route);
        await page.locator(".story-back, .edu-back").click();
        await page.waitForURL("**/#projects");
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
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
