#!/usr/bin/env node
/**
 * yarn test: corre solo los tests de Playwright de las rutas que tocó tu cambio.
 *
 *   yarn test              detecta cambios -> corre los tests de esas rutas
 *   yarn test --build      igual, y al final next build
 *   yarn test --listar     solo dice qué rutas/tests correría
 *   yarn test:all          toda la suite (playwright test)
 *
 * Qué cuenta como cambio: tu rama contra el merge-base con origin/master,
 * más lo que tengas sin commit (es una herramienta local; no publica nada).
 *
 * Cómo llega de un archivo a una ruta: arma el grafo de imports de src/
 * (rutas relativas y el alias "@/") y sube desde cada archivo cambiado hasta
 * las páginas que lo usan. Cada página da su ruta, y la ruta es la carpeta
 * de sus tests:
 *     src/app/dashboard/<ruta>/...  ->  tests/<ruta>/    (ej. tests/pase-entrada/)
 *     src/app/auth/<pantalla>/...   ->  tests/<pantalla>/ (ej. tests/login/)
 * Los imports que solo traen tipos no cuentan (no cambian lo que se pinta).
 *
 * Corre todo si cambia algo base (ver BASE abajo). Si cambia algo dentro de
 * tests/<ruta>/ (un spec, una respuesta guardada), corre esa carpeta.
 * Ruta tocada sin carpeta de tests = aviso.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const argv = process.argv.slice(2);
const args = new Set(argv);
// --archivos a,b,c  simula qué archivos cambiaron (para probar la detección)
const simulados = argv.includes("--archivos") ? argv[argv.indexOf("--archivos") + 1].split(",") : null;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();

// Cambiar uno de estos afecta a todas las pantallas: se corre toda la suite.
const BASE = [
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/providers\.tsx$/,
  /^src\/app\/dashboard\/layout\.tsx$/,
  /^src\/middleware\.ts$/,
  /^src\/config\//,
  /^src\/store\/useAuthStore/,
  /^package\.json$/,
  /^yarn\.lock$/,
  /^next\.config\./,
  /^tsconfig\.json$/,
  /^playwright\.config\.ts$/,
  /^tests\/support\//,
];

// ---------- 1. archivos cambiados ----------
function changedFiles() {
  try { sh("git fetch -q origin master"); } catch { /* sin red: usa lo que haya */ }
  const base = sh("git merge-base origin/master HEAD");
  const out = [
    sh(`git diff --name-only ${base}`),            // commits de la rama + sin commit
    sh("git ls-files --others --exclude-standard"), // archivos nuevos sin agregar
  ].join("\n");
  return [...new Set(out.split("\n").filter(Boolean))];
}

// ---------- 2. grafo de imports de src/ ----------
const EXT = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // paquete de node_modules
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXT) if (fs.existsSync(base + ext)) return base + ext;
  return null;
}
// Nombres que un archivo exporta como tipo (export type X / export interface X).
const typeCache = new Map();
function exportedTypes(file) {
  if (!typeCache.has(file)) {
    const src = fs.readFileSync(file, "utf8");
    typeCache.set(file, new Set([...src.matchAll(/export\s+(?:declare\s+)?(?:type|interface)\s+(\w+)/g)].map((m) => m[1])));
  }
  return typeCache.get(file);
}

// Un import que solo trae tipos no cambia lo que se pinta: no conecta archivos.
// Si no, utils.ts (lo usan cientos de archivos) importa un tipo de un hook y
// cualquier cambio en ese hook "afectaría" a todas las rutas.
function typeOnly(clause, dep) {
  if (/^\s*type\b/.test(clause)) return true;                 // import type { X }
  const m = clause.match(/^\s*\{([^}]*)\}\s*$/);              // solo { A, B }, sin default ni *
  if (!m) return false;
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.length) return false;
  const types = exportedTypes(dep);
  return names.every((n) => /^type\s/.test(n) || types.has(n.split(/\s+as\s+/)[0]));
}

function reverseGraph() {
  const rev = new Map(); // archivo -> archivos que lo importan
  const re = /\b(import|export)\s+([^'";]*?)\s+from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]/gm;
  for (const file of walk(path.join(ROOT, "src"))) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(re)) {
      const spec = m[3] || m[4] || m[5];
      const dep = resolveImport(file, spec);
      if (!dep) continue;
      if (m[3] && m[1] === "import" && typeOnly(m[2], dep)) continue;
      if (!rev.has(dep)) rev.set(dep, new Set());
      rev.get(dep).add(file);
    }
  }
  return rev;
}

// ---------- 3. de archivo a rutas ----------
function routeOf(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const m = rel.match(/^src\/app\/(?:dashboard|auth)\/([^/]+)\//) || rel.match(/^src\/app\/([^/]+)\//);
  return m ? m[1] : null;
}
function affectedRoutes(files, rev) {
  const routes = new Set();
  const seen = new Set();
  const queue = files.filter((f) => f.startsWith("src/")).map((f) => path.join(ROOT, f));
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    const route = routeOf(f);
    if (route) routes.add(route);                 // archivos dentro de una ruta cuentan para esa ruta
    for (const parent of rev.get(f) || []) queue.push(parent);
  }
  return routes;
}

// ---------- 4. rutas que tienen carpeta de tests ----------
const NO_RUTA = new Set(["support", ".auth", "test_logs", "playwright-report"]);
function testFolders() {
  return new Set(
    fs.readdirSync(path.join(ROOT, "tests"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !NO_RUTA.has(e.name))
      .map((e) => e.name),
  );
}

// Binarios de node_modules/.bin directo (con npx salen avisos "npm warn" de yarn).
const bin = (name) => path.join(ROOT, "node_modules", ".bin", name);

// ---------- main ----------
const files = simulados || changedFiles();
const base = files.filter((f) => BASE.some((re) => re.test(f)));
const carpetas = testFolders();
const routes = affectedRoutes(files, reverseGraph());
for (const f of files) {                           // cambios dentro de tests/<ruta>/
  const m = f.match(/^tests\/([^/]+)\//);
  if (m && carpetas.has(m[1])) routes.add(m[1]);
}
const aCorrer = [...routes].filter((r) => carpetas.has(r)).sort();
const sinTests = [...routes].filter((r) => !carpetas.has(r)).sort();

console.log(`Archivos cambiados: ${files.length}`);
if (base.length) console.log(`Cambio base (${base.join(", ")}): corre toda la suite`);
else {
  const todas = [...routes].sort();
  console.log(`Rutas afectadas: ${todas.length > 8 ? `${todas.length} rutas` : todas.join(" ") || "(ninguna)"}`);
  if (aCorrer.length) console.log(`Con tests:       ${aCorrer.map((r) => `tests/${r}/`).join(" ")}`);
  if (sinTests.length > 6) console.log(`! Sin tests:     ${sinTests.length} rutas (${sinTests.slice(0, 5).join(" ")} ...)`);
  else if (sinTests.length) console.log(`! Sin tests:     ${sinTests.join(" ")}`);
}

let pwArgs = null;
if (base.length) pwArgs = [];
else if (aCorrer.length) pwArgs = aCorrer.map((r) => `tests/${r}/`);

if (args.has("--listar")) process.exit(0);

let code = 0;
if (pwArgs) {
  console.log(`\n> playwright test ${pwArgs.join(" ")}\n`);
  code = spawnSync(bin("playwright"), ["test", ...pwArgs], { cwd: ROOT, stdio: "inherit" }).status ?? 1;
} else {
  console.log("\nNo hay tests de Playwright para estas rutas.");
}

if (code === 0 && args.has("--build")) {
  console.log("\n> next build\n");
  code = spawnSync(bin("next"), ["build"], { cwd: ROOT, stdio: "inherit" }).status ?? 1;
}
console.log(code === 0 ? "\n✓ yarn test en verde" : `\n✗ yarn test en rojo (código ${code})`);
process.exit(code);
