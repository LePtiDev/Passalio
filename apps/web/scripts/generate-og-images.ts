import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { ogImageFr } from "../src/copy/og-image-fr.ts";

const DIST = "dist";
const OUTPUT = "public/og";
const FONT =
  "node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2";

const pathsFromSitemap = (xml: string): ReadonlyArray<string> =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1] ?? "/").pathname);

const htmlFileFor = (path: string): string =>
  path === "/" ? join(DIST, "index.html") : join(DIST, `${path.slice(1)}.html`);

const imageNameFor = (path: string): string =>
  path === "/" ? "accueil" : path.slice(1).replaceAll("/", "-");

const decodeEntities = (text: string): string =>
  text
    .replaceAll("&#39;", "’")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();

const headingOf = (html: string): string =>
  decodeEntities(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "");

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const cardHtml = (
  section: string,
  title: string,
  font: string,
  logo: string,
): string => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
@font-face { font-family: Jakarta; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: Jakarta, sans-serif; color: #0f2a44;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fb 60%, #e6f4ee 100%);
  display: flex; flex-direction: column; justify-content: space-between; padding: 72px 80px; }
.logo { height: 34px; width: auto; align-self: flex-start; }
.section { font-size: 22px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0e7c5a; }
h1 { font-size: 64px; line-height: 1.08; font-weight: 700; letter-spacing: -0.03em; max-width: 1000px; }
.foot { display: flex; justify-content: space-between; align-items: center; font-size: 24px; color: #475569; }
</style></head><body>
<img class="logo" src="data:image/svg+xml;base64,${logo}" alt="">
<div style="display:flex;flex-direction:column;gap:22px"><p class="section">${escapeHtml(section)}</p><h1>${escapeHtml(title)}</h1></div>
<div class="foot"><span>${ogImageFr.domain}</span><span>${ogImageFr.tagline}</span></div>
</body></html>`;

const main = async () => {
  const paths = pathsFromSitemap(await readFile(join(DIST, "sitemap.xml"), "utf8"));
  const font = (await readFile(FONT)).toString("base64");
  const logo = (await readFile("public/passalio-logo.svg")).toString("base64");
  await mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch(
    process.env["PLAYWRIGHT_CHROMIUM_PATH"]
      ? { executablePath: process.env["PLAYWRIGHT_CHROMIUM_PATH"] }
      : {},
  );
  await Promise.all(
    paths.map(async (path) => {
      const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
      const title = headingOf(await readFile(htmlFileFor(path), "utf8"));
      const section =
        ogImageFr.sections.find((candidate) => path.startsWith(candidate.prefix))?.label ??
        ogImageFr.defaultSection;
      await page.setContent(cardHtml(section, title, font, logo));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(OUTPUT, `${imageNameFor(path)}.png`) });
      process.stdout.write(`${path}\n`);
      await page.close();
    }),
  );
  await browser.close();
};

await main();
