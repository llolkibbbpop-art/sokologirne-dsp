/*
 * Production build → dist/
 *  - all scripts in page order are joined into one bundle and minified (names shortened, comments and
 *    formatting removed); debug hooks (window.__sim, __net …) are moved into a private object;
 *  - the stylesheet is minified; file names carry a content hash (no stale caches);
 *  - index.html gets a strict Content-Security-Policy: only this site's own script (+ PeerJS from two
 *    CDNs for network play), no inline scripts, no eval, no plugins, no foreign forms or frames;
 *  - dist/artifact.html: the same page as a body fragment for the claude.ai artifact (no CSP meta there,
 *    the host page sets its own policy).
 * Usage: node build/build.js   (needs esbuild: npm i -D esbuild, or the copy in /opt/npm-tools)
 */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
let esbuild;
for (const p of ["esbuild", "/opt/npm-tools/node_modules/esbuild"]) { try { esbuild = require(p); break; } catch (e) { /* next */ } }
if (!esbuild) { console.error("esbuild not found: npm i -D esbuild"); process.exit(1); }

const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "dist");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

  // ---- script bundle
  let js = scripts.map((f) => read(f)).join(";\n");
  js = js.replace(/\bwindow\.__(\w+)/g, "__dbg.$1");
  js = "(function(){\"use strict\";var __dbg={};\n" + js + "\n})();";
  const outJs = (await esbuild.transform(js, { minify: true, target: "es2020", legalComments: "none", charset: "utf8", drop: ["debugger"] })).code;
  const jsName = "app." + hash(outJs) + ".js";
  fs.writeFileSync(path.join(OUT, jsName), outJs);

  // ---- styles
  let css = read("css/style.css").replace(/url\("\.\.\/fonts\//g, 'url("fonts/');
  const outCss = (await esbuild.transform(css, { loader: "css", minify: true, legalComments: "none", charset: "utf8" })).code;
  const cssName = "app." + hash(outCss) + ".css";
  fs.writeFileSync(path.join(OUT, cssName), outCss);
  fs.copyFileSync(path.join(ROOT, "fonts/arm-pixel.woff"), path.join(OUT, "fonts/arm-pixel.woff"));
  for (const f of ["README.txt", "OFL.txt"]) fs.copyFileSync(path.join(ROOT, "fonts", f), path.join(OUT, "fonts", f));
  fs.copyFileSync(path.join(ROOT, "NOTICE.md"), path.join(OUT, "NOTICE.md"));

  // ---- page
  const CSP = [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://*.peerjs.com wss://*.peerjs.com",
    "media-src 'none'", "object-src 'none'", "frame-src 'none'", "worker-src 'none'",
    "base-uri 'none'", "form-action 'none'"
  ].join("; ");
  let page = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<link rel="stylesheet" href="css\/style\.css">/, `<link rel="stylesheet" href="${cssName}">`)
    .replace(/(<script src="[^"]+"><\/script>\s*)+/, `<script src="${jsName}"></script>\n`)
    .replace(/<meta charset="utf-8">/, `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">\n<meta name="referrer" content="no-referrer">`)
    .replace(/\n\s+/g, "\n");
  fs.writeFileSync(path.join(OUT, "index.html"), page);
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

  // ---- artifact fragment (head extras + body)
  const a = page.indexOf('<meta name="theme-color"'), head = page.slice(a, page.indexOf("</head>")).trim();
  const body = page.slice(page.indexOf("<body>") + 6, page.indexOf("</body>")).trim();
  fs.writeFileSync(path.join(OUT, "artifact.html"), head + "\n" + body + "\n");

  const kb = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + " KB";
  const srcKb = (scripts.reduce((n, f) => n + fs.statSync(path.join(ROOT, f)).size, 0) / 1024).toFixed(0);
  console.log("dist/" + jsName, kb(jsName), "(sources " + srcKb + " KB in " + scripts.length + " files)");
  console.log("dist/" + cssName, kb(cssName));
  console.log("dist/index.html", kb("index.html"));
})();
