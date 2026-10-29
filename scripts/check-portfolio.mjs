import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { privateClientLeaks, privateClientMentions, privateClientPdfLeaks } from "./client-privacy.mjs";
import { CV_LOCALES, CV_VARIANTS, MANIFEST, PDF_DIR, cvPdfFile, cvRoute, cvSourceHash, pdfPageCount, pdfVersion } from "./cv-pdf-shared.mjs";

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

/** Hosted résumés: /cv (English) and /es/cv (Spanish), five variants plus an index each. */
async function checkCvPages(browser) {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  assert.equal(manifest.sourceHash, await cvSourceHash(), "CV PDFs are stale: run `pnpm cv:pdf` against a fresh build and commit public/cv/files");
  // Private clients are described generically, never named: in the sources, the public files or the committed PDFs.
  assert.deepEqual(await privateClientLeaks(["src", "public"]), [], "No private client named in src/ or public/");
  assert.deepEqual(await privateClientPdfLeaks(PDF_DIR), [], "No private client named in the committed CV PDFs");
  // One A4 page per résumé, for the committed PDFs and the live print layout.
  // Each manifest entry records the content version the site appends as ?v=.
  const versions = new Map();
  for (const locale of CV_LOCALES) {
    for (const variant of CV_VARIANTS) {
      const file = cvPdfFile(variant, locale);
      const bytes = await readFile(`${PDF_DIR}/${file}`);
      assert.equal(pdfPageCount(bytes), 1, `${file}: one page`);
      const entry = manifest.files.find((item) => item.file === file);
      assert.ok(entry, `${file}: listed in the manifest`);
      assert.equal(entry.version, pdfVersion(bytes), `${file}: manifest version matches the committed PDF (run \`pnpm cv:pdf\`)`);
      versions.set(file, entry.version);
    }
  }
  /** The URL the site must link: the file plus its current manifest version, so a regenerated PDF is never served from cache. */
  const versionedPdf = (variant, locale) => {
    const file = cvPdfFile(variant, locale);
    return `/cv/files/${file}?v=${versions.get(file)}`;
  };
  // Versioned URLs are content-addressed and cached for good; a bare URL always revalidates.
  {
    const file = cvPdfFile(CV_VARIANTS[0], "en");
    const versioned = await fetch(`${baseURL}${versionedPdf(CV_VARIANTS[0], "en")}`);
    assert.match(versioned.headers.get("cache-control") ?? "", /immutable/, `${file}?v=: immutable cache`);
    await versioned.arrayBuffer();
    const bare = await fetch(`${baseURL}/cv/files/${file}`);
    assert.match(bare.headers.get("cache-control") ?? "", /must-revalidate/, `${file}: bare URL revalidates`);
    await bare.arrayBuffer();
  }
  const pages = CV_LOCALES.flatMap((locale) => [
    { route: locale === "es" ? "/es/cv" : "/cv", locale, variant: null },
    ...CV_VARIANTS.map((variant) => ({ route: cvRoute(variant, locale), locale, variant })),
  ]);
  for (const [name, options] of [
    ["cv-mobile", { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }],
    ["cv-desktop", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    progress.scenario = name;
    progress.page = page;
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const { route, locale, variant } of pages) {
      const response = await page.goto(`${baseURL}${route}`);
      assert.equal(response.status(), 200, `${name}: ${route}`);
      await page.waitForFunction((lang) => document.documentElement.lang === lang, locale, { timeout: 5000 });
      assert.equal(await page.locator(".cv-root").getAttribute("lang"), locale, `${route}: content language`);
      assert.equal(await page.locator("h1").count(), 1, `${route}: one h1`);
      assert.equal(await page.locator("main#main-content").count(), 1, `${route}: main landmark`);
      // CV pages wear the portfolio chrome (nav, CSS night sky) but never the WebGPU layer.
      assert.equal(await page.locator(".site-nav").count(), 1, `${route}: portfolio nav`);
      assert.equal(await page.locator(".cv-cosmos").count(), 1, `${route}: night-sky backdrop`);
      assert.equal(await page.locator("[data-scene-root]").count(), 0, `${route}: no 3D layer`);
      // The backdrop is static: nothing may loop under the glass panels (no CSS loops, no shooting stars).
      assert.equal(
        await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length),
        0,
        `${route}: no infinite animations`,
      );
      assert.equal(await page.locator(".star-aura-layer").count(), 0, `${route}: no shooting stars`);
      if (options.reducedMotion === "reduce") {
        assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.animationName === "cv-rise").length), 0, `${route}: no entrance motion with reduced motion`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: horizontal overflow ${route}`);
      const html = await page.content();
      assert.equal(/planet/i.test(await page.locator(".cv-root").evaluate((el) => el.outerHTML)), false, `${route}: no 'planet' wording`);
      assert.equal(/541[-\s]?2480|5493815412480|Delf[ií]n Gallo|Cruz Alta/i.test(html), false, `${route}: no phone number or home address`);
      assert.equal(privateClientMentions(html), 0, `${route}: no private client named`);
      assert.equal(new URL(await page.locator("link[rel='canonical']").getAttribute("href")).pathname, route, `${route}: canonical`);
      const alternates = Object.fromEntries(
        await page.locator("link[rel='alternate'][hreflang]").evaluateAll((links) => links.map((l) => [l.getAttribute("hreflang"), new URL(l.href).pathname])),
      );
      const enRoute = route.replace(/^\/es/, "");
      assert.deepEqual(alternates, { en: enRoute, es: `/es${enRoute}`, "x-default": enRoute }, `${route}: hreflang alternates`);
      const toggle = page.locator(".site-nav [data-lang-switch]");
      assert.equal(await toggle.getAttribute("href"), locale === "es" ? enRoute : `/es${enRoute}`, `${route}: EN/ES toggle`);
      if (variant) {
        const pdf = await page.locator("a[data-cv-pdf]").getAttribute("href");
        assert.equal(pdf, versionedPdf(variant, locale), `${route}: PDF button links the current manifest version`);
        assert.equal(await page.locator("a[data-cv-pdf]").getAttribute("download"), cvPdfFile(variant, locale), `${route}: clean download filename`);
        const file = await page.request.get(`${baseURL}${pdf}`);
        assert.equal(file.status(), 200, `${route}: PDF ${pdf}`);
        assert.match(file.headers()["content-type"], /pdf/);
        assert.equal((await file.body()).subarray(0, 4).toString(), "%PDF");
        assert.equal(await page.locator(".cv-section h2").count() >= 6, true, `${route}: résumé sections`);
        assert.equal(await page.locator(`.cv-bar__versions a[aria-current='page']`).getAttribute("href"), route);
        await page.emulateMedia({ media: "print" });
        if (name === "cv-desktop") {
          await page.evaluate(async () => {
            await Promise.allSettled(Array.from(document.fonts, (face) => face.load()));
            await document.fonts.ready;
          });
          const printed = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
          assert.equal(pdfPageCount(printed), 1, `${route}: prints on one A4 page`);
        }
        for (const screenOnly of [".cv-bar", ".site-nav", ".cv-cosmos"]) {
          assert.equal(await page.locator(screenOnly).isVisible(), false, `${route}: ${screenOnly} hidden in print`);
        }
        assert.equal(await page.locator(".cv-doc").isVisible(), true, `${route}: résumé printed`);
        await page.emulateMedia({ media: "screen" });
      } else {
        assert.equal(await page.locator(".cv-card").count(), CV_VARIANTS.length, `${route}: index lists every version`);
        // Each card is one action: the whole tile downloads that version's PDF, with no inner buttons.
        const cards = await page.locator(".cv-card").evaluateAll((els) =>
          els.map((el) => ({
            tag: el.tagName,
            href: el.getAttribute("href"),
            download: el.hasAttribute("download"),
            label: el.getAttribute("aria-label") ?? "",
            inner: el.querySelectorAll("a, button").length,
          })),
        );
        assert.deepEqual(
          cards.map(({ href }) => href),
          CV_VARIANTS.map((variant) => versionedPdf(variant, locale)),
          `${route}: cards link to the current manifest version of each PDF`,
        );
        for (const card of cards) {
          assert.equal(card.tag, "A", `${route}: card is a link`);
          assert.equal(card.download, true, `${route}: card downloads`);
          assert.match(card.label, locale === "es" ? /^Descargar el CV .+ \(PDF\)$/ : /^Download .+ CV \(PDF\)$/, `${route}: card label`);
          assert.equal(card.inner, 0, `${route}: no nested links or buttons in a card`);
        }
        assert.equal(/R[ée]sum[ée]/.test(await page.locator(".cv-root").innerText()), false, `${route}: CV wording, no "Résumé"`);
      }
      if (name === "cv-mobile") {
        // Let the entrance motion settle so contrast is measured on the final frame.
        await page.waitForFunction(() => document.getAnimations().every((a) => a.animationName !== "cv-rise" || a.playState === "finished"));
        const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        assert.deepEqual(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), [], `${name}: accessibility ${route}`);
      }
      if (route === "/cv/applied-ai" || route === "/es/cv/fullstack") {
        await page.screenshot({ path: `${output}/${name}-${route.slice(1).replaceAll("/", "-")}.png`, fullPage: true });
      }
    }
    // The toggle keeps the variant and switches the language.
    await page.goto(`${baseURL}/cv/backend`);
    await Promise.all([page.waitForURL("**/es/cv/backend"), page.locator(".site-nav [data-lang-switch]").click()]);
    await page.waitForFunction(() => document.documentElement.lang === "es");
    assert.equal(await page.locator("h2#cv-experience").textContent(), "Experiencia");
    // Clicking an index card downloads that version's PDF.
    await page.goto(`${baseURL}/cv`);
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator(".cv-card").first().click()]);
    assert.equal(download.suggestedFilename(), cvPdfFile(CV_VARIANTS[0], "en"), `${name}: index card downloads its PDF`);
    // The site nav keeps three section links; the CV is reached from the hero CTA and /cv, not the nav.
    await page.goto(baseURL);
    const navHrefs = [...new Set(await page.locator(".site-nav a.link-underline").evaluateAll((links) => links.map((l) => l.getAttribute("href"))))];
    assert.deepEqual(navHrefs, ["/#experience", "/#projects", "/#contact"], `${name}: nav links (no CV item)`);
    assert.equal(await page.locator(`.site-nav a[href="/cv"], .site-nav a[href="/es/cv"]`).count(), 0, `${name}: no CV link in the nav`);
    assert.deepEqual(errors, [], `${name}: browser errors on CV pages`);
    await context.close();
    console.log(`PASS ${name} CV pages (${pages.length} routes)`);
  }
}

/** Subtitles that used to sit under the worlds (removed 2026-10-15), in both languages. */
const REMOVED_WORLD_SUBTITLES = [
  "Ingeniería en Sistemas — UTN-FRT y formación continua.",
  "Systems Engineering — UTN-FRT and continuous training.",
  "Herramientas reales: developer tools, IA y productos web.",
  "Real tools: developer tools, AI and web products.",
  "Compartir lo que sé y acompañar a otros en su recorrido técnico.",
  "Sharing what I know and guiding others on their technical journey.",
];

/** Records every puppy landing that mounts on a world, with the world it lands on and when. */
function recordLandings() {
  window.__landings = [];
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || !node.matches("[data-world-landing]")) continue;
        const entry = { href: node.closest(".orbit-select__slot")?.querySelector("a")?.getAttribute("href") ?? null, at: performance.now(), overflow: null };
        window.__landings.push(entry);
        setTimeout(() => {
          entry.overflow = document.documentElement.scrollWidth > innerWidth;
        }, 300);
      }
    }
  }).observe(document, { childList: true, subtree: true });
}

/** Drag pose painted on a world (CSS variables set by the trackball). */
function worldPose(page, slot = "center") {
  return page.locator(`#projects .orbit-select__slot[data-slot="${slot}"] .orbit-select__orb`).evaluate((el) => ({
    roll: el.style.getPropertyValue("--spin-roll"),
    tilt: el.style.getPropertyValue("--spin-tilt"),
    lon: el.style.getPropertyValue("--spin-lon"),
  }));
}

/** Waits until the world stops coasting (inertia) and returns its resting pose. */
async function settledPose(page) {
  let last = await worldPose(page);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(150);
    const next = await worldPose(page);
    if (JSON.stringify(next) === JSON.stringify(last)) return next;
    last = next;
  }
  throw new Error("The world never stopped turning after a release");
}

/** Centre of the centred world, in viewport px. */
async function worldCentre(page) {
  const box = await page.locator('#projects .orbit-select__slot[data-slot="center"] .orbit-select__orb').boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, r: box.width / 2 };
}

/** Opens home on the selector with the auto-rotation settled out of the way. */
async function openSelector(page) {
  await page.goto(`${baseURL}/#projects`);
  await page.waitForLoadState("networkidle");
  await page.locator("#world-details").waitFor();
  await page.locator("#projects .orbit-select__stage").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

/** One finger: press, optionally hold, move in steps, release (CDP touch events, so touch-action and scrolling are real). */
async function touchDrag(cdp, from, to, holdMs, steps = 8) {
  const point = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(from.x, from.y) });
  if (holdMs) await new Promise((resolve) => setTimeout(resolve, holdMs));
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps) });
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
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

/**
 * Experience constellation (src/components/ExperienceTrail.tsx): with motion the
 * trace follows the scroll (lit entries behind the tip, dimmed ones ahead);
 * with reduced motion the whole constellation stays drawn and lit.
 */
async function assertExperienceTrail(page, name, reduced) {
  const read = () => page.evaluate(() => ({
    mode: document.querySelector(".xp-trail")?.dataset.mode,
    states: [...document.querySelectorAll(".xp-entry")].map((entry) => entry.dataset.state),
    offset: Number.parseFloat(document.querySelector(".xp-trail__line")?.style.strokeDashoffset ?? "NaN"),
  }));
  // Park the viewport in the middle of the list and let the trace settle.
  await page.evaluate(() => {
    const list = document.querySelector(".xp-trail");
    window.scrollTo({ top: list.getBoundingClientRect().top + scrollY + list.offsetHeight / 2 - innerHeight / 2, behavior: "instant" });
  });
  await page.waitForTimeout(900);
  const mid = await read();
  assert.ok(mid.states.length > 1, `${name}: experience entries rendered`);
  if (reduced) {
    assert.equal(mid.mode, "static", `${name}: reduced motion keeps the constellation static`);
    assert.deepEqual([...new Set(mid.states)], ["past"], `${name}: reduced motion lights every entry`);
    assert.equal(mid.offset, 0, `${name}: reduced motion draws the whole trace`);
  } else {
    assert.equal(mid.mode, "live", `${name}: the trace follows the scroll`);
    assert.ok(mid.states.includes("active"), `${name}: the entry under the tip is active (${mid.states})`);
    assert.ok(mid.states.includes("upcoming"), `${name}: entries ahead of the tip wait dimmed (${mid.states})`);
    assert.ok(mid.offset > 0, `${name}: the trace is partly drawn mid-list`);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
}

/**
 * The hero CV button downloads the generated Applied AI PDF in the page
 * language, at its current manifest version (never the retired hand-committed file).
 */
async function assertHeroCvLink(page, locale) {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const file = cvPdfFile("applied-ai", locale);
  const entry = manifest.files.find((item) => item.file === file);
  assert.ok(entry, `${file}: listed in the manifest`);
  const link = page.locator("#top [data-hero-cv]");
  assert.equal(await link.count(), 1, "Hero has one CV download link");
  assert.equal(await link.getAttribute("href"), `/cv/files/${file}?v=${entry.version}`, `Hero CV (${locale}) links the current manifest version`);
  assert.equal(await link.getAttribute("download"), file, `Hero CV (${locale}) downloads under a clean file name`);
}

/**
 * The home page goes from the worlds selector straight to "Charlemos": no
 * featured projects block in either language. Plus the Person JSON-LD.
 */
async function assertHomeSections(page, lang) {
  const heading = lang === "es" ? "Proyectos destacados" : "Featured projects";
  assert.equal(await page.getByText(heading).count(), 0, `no featured projects heading (${lang})`);
  assert.equal(await page.locator(".featured, .featured-card").count(), 0, `no featured project cards (${lang})`);
  const order = await page.evaluate(() => [...document.querySelectorAll("#main-content > section")].map((section) => section.id));
  assert.deepEqual(order, ["top", "experience", "projects", "contact"], `home sections (${lang})`);
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  const person = ld["@graph"].find((node) => node["@type"] === "Person");
  assert.equal(person.name, "Francisco Miguel Perez", "Person JSON-LD");
  assert.equal(person.jobTitle, "AI Applied Engineer", "Person JSON-LD job title matches the hero");
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
      await context.addInitScript(recordLandings);
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
        if (route === "/") await assertHeroCvLink(page, "es");
        if (route === "/") await assertExperienceTrail(page, name, name === "reduced-motion");
        if (route === "/") await assertHomeSections(page, "es");
        await page.getByRole("button", { name: "Cambiar a inglés" }).click();
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        if (route === "/") await assertHeroCvLink(page, "en");
        if (route === "/") await assertHomeSections(page, "en");
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
      for (const subtitle of REMOVED_WORLD_SUBTITLES) assert.equal(await page.getByText(subtitle).count(), 0, `Removed world subtitle "${subtitle}"`);
      assert.equal(await page.locator(".orbit-select__tagline, .dossier-hero__lede").count(), 0, "No subtitle slot under the worlds");
      assert.equal(await page.getByText(/Elegí un mundo y descubrí/).count(), 0, "Removed the section subtitle");
      assert.equal(await page.getByText("Desarrollo de producto").count(), 0, "Hero no longer says 'Desarrollo de producto'");
      assert.equal(await page.locator("#top").getByText(/AI Applied Engineer/).count(), 1, "Hero role is AI Applied Engineer");
      // Scoped to the selector markup.
      assert.equal(await page.locator("#projects .orbit-select").evaluate((el) => /planet/i.test(el.outerHTML)), false, "No 'planet' wording in the selector markup");
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
      const landings = await page.evaluate(() => window.__landings);
      if (name === "reduced-motion") assert.deepEqual(landings, [], "Reduced motion: no landing, a short fade then the jump");
      else assert.deepEqual(landings.map(({ href }) => href), [routes[1]], "The puppy lands on the entered world before the jump");
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader never replays on client navigation");
      await page.locator(".story-back").click();
      await page.waitForURL((url) => new URL(url).pathname === "/" && new URL(url).hash.startsWith("#projects"));
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader never replays going back home");
      await page.reload();
      await page.waitForTimeout(400);
      assert.equal(await page.locator("[data-rocket-loader]").count(), 0, "Launch loader shows once per browser session");
      const heading = page.locator("#contact h2");
      assert.equal(await heading.count(), 1, "Contact always has a semantic heading");
      if (options.isMobile) assert.equal(await page.locator("#contact .contact-title-stars svg").evaluate((el) => el.getBoundingClientRect().width > 100), true, "Contact shows the star title on phones");
      else if (fallback) assert.equal(await heading.evaluate((el) => el.getBoundingClientRect().width > 100), true, "Contact has a visible DOM heading without the 3D title");
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
      for (const [from, to] of [["/curso-n8n", "/teaching"], ["/university", "/education"], ["/cv/FranciscoPerez-AIEngineer.pdf", "/cv/files/francisco-perez-cv-applied-ai-en.pdf"]]) {
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

    // Worlds: press-and-drag turns a world (trackball) and never navigates;
    // a plain click / tap lands the puppy, then zooms into the world.
    for (const [name, options] of [
      ["landing-desktop", { viewport: { width: 1440, height: 900 } }],
      ["landing-mobile", { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }],
    ]) {
      const context = await browser.newContext(options);
      await context.addInitScript(recordLandings);
      const page = await context.newPage();
      progress.scenario = name;
      progress.page = page;
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await openSelector(page);
      const before = await worldPose(page);
      const centre = await worldCentre(page);
      if (options.hasTouch) {
        const cdp = await context.newCDPSession(page);
        // A held press grabs the world in any direction, without scrolling the page.
        const scrollBefore = await page.evaluate(() => scrollY);
        await touchDrag(cdp, { x: centre.x - 30, y: centre.y + 20 }, { x: centre.x + 50, y: centre.y - 60 }, 260);
        const after = await settledPose(page);
        assert.equal(new URL(page.url()).pathname, "/", `${name}: a held drag never enters the world`);
        assert.equal(await page.evaluate(() => scrollY), scrollBefore, `${name}: a grabbed world does not scroll the page`);
        assert.notDeepEqual(after, before, `${name}: touch drag turns the world (${JSON.stringify(after)})`);
        // A quick vertical swipe over the world still scrolls the page.
        await touchDrag(cdp, { x: centre.x, y: centre.y + 40 }, { x: centre.x, y: centre.y - 160 }, 0, 6);
        await page.waitForTimeout(600);
        assert.notEqual(await page.evaluate(() => scrollY), scrollBefore, `${name}: a quick vertical swipe over a world scrolls the page`);
        assert.deepEqual(await worldPose(page), after, `${name}: the scroll swipe does not turn the world`);
        await cdp.detach();
        await openSelector(page);
      } else {
        await page.mouse.move(centre.x, centre.y);
        await page.mouse.down();
        await page.mouse.move(centre.x + 90, centre.y + 40, { steps: 10 });
        await page.mouse.move(centre.x + 140, centre.y - 30, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(700);
        assert.equal(new URL(page.url()).pathname, "/", `${name}: a drag never enters the world`);
        const after = await worldPose(page);
        assert.notDeepEqual(after, before, `${name}: mouse drag turns the world`);
        assert.notEqual(after.roll, "0.00deg", `${name}: a diagonal drag rolls the world off its axis`);
        assert.equal(await page.evaluate(() => window.__landings.length), 0, `${name}: no landing after a drag`);
        assert.equal(await page.locator(".orbit-select[data-dragging]").count(), 0, `${name}: drag state cleared`);
      }
      for (const subtitle of REMOVED_WORLD_SUBTITLES) assert.equal(await page.getByText(subtitle).count(), 0, `${name}: removed world subtitle "${subtitle}"`);
      // A plain click / tap: the puppy lands on the world, then the jump.
      const card = page.locator("#world-details");
      const href = await card.getAttribute("href");
      const target = await worldCentre(page);
      const started = Date.now();
      await Promise.all([
        page.waitForURL(`**${href}`, { timeout: 4000 }),
        options.hasTouch ? page.touchscreen.tap(target.x, target.y) : page.mouse.click(target.x, target.y),
      ]);
      const elapsed = Date.now() - started;
      const landings = await page.evaluate(() => window.__landings);
      assert.deepEqual(landings.map((entry) => entry.href), [href], `${name}: one landing, on the clicked world`);
      assert.equal(landings[0].overflow, false, `${name}: no horizontal overflow mid-landing`);
      assert.ok(elapsed < 2400, `${name}: landing + jump stay snappy (${elapsed} ms)`);
      await page.locator("h1").waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: no horizontal overflow on ${href}`);
      assert.deepEqual(errors, [], `${name}: browser errors`);
      await context.close();
      console.log(`PASS ${name} world drag and puppy landing (${elapsed} ms to ${href})`);
    }

    // The MCP and llms.txt never carry the removed world subtitles either.
    {
      const llms = await (await fetch(`${baseURL}/llms.txt`)).text();
      for (const subtitle of REMOVED_WORLD_SUBTITLES) assert.equal(llms.includes(subtitle), false, `llms.txt drops "${subtitle}"`);
      console.log("PASS removed world subtitles in llms.txt");
    }

    if (process.env.HEADFUL === "1") return;
    await checkCvPages(browser);
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
        assert.match(decodeURIComponent(href.slice(prefix.length)), /https:\/\/franprz\.vercel\.app\/api\/mcp/, `${label} prompt points at the MCP server`);
        assert.equal(await link.getAttribute("target"), "_blank");
        assert.match(await link.getAttribute("rel"), /noopener/);
      }
      assert.equal(await page.getByRole("button", { name: "Copy prompt" }).count(), 1, "Copy-prompt fallback");
      assert.equal(await page.locator("main pre").count() >= 1, true, "The assistant prompt snippet is rendered");
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
      if (name === "no-javascript") await assertHomeSections(page, "es");
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
