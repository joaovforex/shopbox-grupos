import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const cloudflareHeaders = await readFile(new URL("../_headers", import.meta.url), "utf8");

const externalLinks = [...html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)].map(([tag]) => tag);
assert.ok(externalLinks.length > 0, "a página deve manter seus links externos");
for (const tag of externalLinks) {
  assert.match(tag, /\brel=["'][^"']*noopener[^"']*["']/i, "todo target=_blank deve usar noopener");
}

assert.doesNotMatch(html, /<script\b/i, "a landing page deve continuar sem JavaScript executável");
assert.doesNotMatch(html, /http:\/\//i, "todos os recursos devem usar HTTPS");

const globalRule = config.headers.find(({ source }) => source === "/(.*)");
const csp = globalRule?.headers.find(({ key }) => key === "Content-Security-Policy")?.value;
assert.match(csp ?? "", /default-src 'none'/);
assert.match(csp ?? "", /frame-ancestors 'none'/);
// A página usa <style> inline e imagens data: — a CSP precisa permitir só isso.
assert.match(csp ?? "", /style-src 'self' 'unsafe-inline'/);
assert.match(csp ?? "", /img-src 'self' data:/);

// O arquivo _headers (Cloudflare Pages) precisa espelhar o vercel.json.
function parseCloudflareHeaders(text) {
  const rules = new Map();
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    if (/^\S/.test(rawLine)) {
      current = new Map();
      rules.set(rawLine.trim(), current);
      continue;
    }
    assert.ok(current, `cabeçalho fora de um bloco de rota em _headers: ${rawLine}`);
    const idx = rawLine.indexOf(":");
    assert.ok(idx > 0, `linha inválida em _headers: ${rawLine}`);
    current.set(rawLine.slice(0, idx).trim().toLowerCase(), rawLine.slice(idx + 1).trim());
  }
  return rules;
}

const cfGlobal = parseCloudflareHeaders(cloudflareHeaders).get("/*");
assert.ok(cfGlobal, "_headers precisa definir a rota /*");
for (const { key, value } of globalRule?.headers ?? []) {
  assert.equal(cfGlobal.get(key.toLowerCase()), value, `_headers diverge do vercel.json em ${key}`);
}

console.log("Verificações de segurança do ShopBox Grupos concluídas.");
