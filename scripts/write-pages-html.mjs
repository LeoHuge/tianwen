/**
 * GitHub Pages prerender writes `/` as an empty redirect, because the site
 * lives under `/tianwen/` and `withBase("/", "/tianwen/")` drops the slash.
 * Fetch the real pages and save them next to the built assets.
 */
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

if (process.env.NITRO_PRESET !== "github_pages") {
  process.exit(0);
}

const app = (await import("../node_modules/.nitro/prerender/index.mjs")).default;
const base = (process.env.VITE_BASE_PATH || "/tianwen/").replace(/\/$/, "");
const outDir = join(process.cwd(), ".output/public");
const routes = ["/", "/pricing", "/studio", "/orders", "/risks", "/code"];

for (const route of routes) {
  const urlPath = `${base}${route === "/" ? "/" : route}`;
  const res = await app.fetch(
    new Request(`http://127.0.0.1${urlPath}`, {
      headers: { "x-nitro-prerender": urlPath },
    }),
  );
  if (res.status !== 200) {
    throw new Error(`Pages render ${urlPath} returned ${res.status}`);
  }
  const html = (await res.text())
    .replaceAll('="/favicon.svg"', `="${base}/favicon.svg"`)
    .replaceAll('="/logo.svg"', `="${base}/logo.svg"`)
    .replaceAll('="/og.jpg"', `="${base}/og.jpg"`)
    .replaceAll('="/poster.jpg"', `="${base}/poster.jpg"`)
    .replaceAll('="/__grok/', `="${base}/__grok/`);
  if (!html.includes("<html")) {
    throw new Error(`Pages render ${urlPath} did not return HTML`);
  }
  const relative = route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
  const file = join(outDir, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`[pages] ${relative} (${html.length} bytes)`);
}

await copyFile(join(outDir, "index.html"), join(outDir, "404.html"));
await rm(join(outDir, "index"), { force: true });
