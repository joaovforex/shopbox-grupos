import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

const externalLinks = [...html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)].map(([tag]) => tag);
assert.ok(externalLinks.length > 0, "a página deve manter seus links externos");
for (const tag of externalLinks) {
  assert.match(tag, /\brel=["'][^"']*noopener[^"']*["']/i, "todo target=_blank deve usar noopener");
}

assert.doesNotMatch(html, /<script\b/i, "a landing page deve continuar sem JavaScript executável");
assert.doesNotMatch(html, /http:\/\//i, "todos os recursos devem usar HTTPS");

const csp = config.headers
  .find(({ source }) => source === "/(.*)")
  ?.headers.find(({ key }) => key === "Content-Security-Policy")?.value;
assert.match(csp ?? "", /default-src 'none'/);
assert.match(csp ?? "", /frame-ancestors 'none'/);

console.log("Verificações de segurança do ShopBox Grupos concluídas.");
