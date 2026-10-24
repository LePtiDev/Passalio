import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const DIST = "dist";
const PORT = Number(process.env["PORT"] ?? "4322");

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const fileFor = (pathname: string): string => {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  if (safe === "/") return join(DIST, "index.html");
  return extname(safe) === "" ? join(DIST, `${safe}.html`) : join(DIST, safe);
};

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = fileFor(pathname);
  const body = await readFile(file).catch(() => null);
  if (body !== null) {
    response.writeHead(200, {
      "content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
    });
    response.end(body);
    return;
  }
  const notFound = await readFile(join(DIST, "404.html")).catch(() => Buffer.from("Not found"));
  response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  response.end(notFound);
}).listen(PORT);
