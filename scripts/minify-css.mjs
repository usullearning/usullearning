#!/usr/bin/env node
/*
 * Conservative, dependency-free CSS minifier for the build pipeline.
 *
 * It only makes changes that never alter CSS semantics:
 *   - strips /* ... *\/ comments
 *   - collapses runs of whitespace (outside strings) to a single space
 *   - removes whitespace immediately around { } ; and drops the last ; in a block
 *
 * A single state machine tracks comment / string context so that:
 *   - whitespace inside quoted strings (e.g. url("data:image/svg+xml, ... "))
 *     and significant spaces inside calc() are preserved
 *   - " or ' characters inside comments (e.g. `MacBook Air 13"`) are ignored
 *
 * Usage: node scripts/minify-css.mjs <src.css> <out.css>
 * On any failure it exits non-zero and writes nothing, so the caller can fall
 * back to shipping the un-minified stylesheet.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , srcPath, outPath] = process.argv;
if (!srcPath || !outPath) {
  console.error('usage: minify-css.mjs <src.css> <out.css>');
  process.exit(2);
}

const css = readFileSync(srcPath, 'utf8');
let out = '';
let i = 0;
const n = css.length;

const isWs = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';

while (i < n) {
  const c = css[i];

  // Comment: /* ... */  (only outside strings — we're always outside strings here)
  if (c === '/' && css[i + 1] === '*') {
    i += 2;
    while (i < n && !(css[i] === '*' && css[i + 1] === '/')) i++;
    i += 2; // skip closing */ (or run off the end)
    // A comment acts as a whitespace separator; normalize via the pending-space logic below.
    if (out.length && !isWs(out[out.length - 1]) && out[out.length - 1] !== '{' &&
        out[out.length - 1] !== '}' && out[out.length - 1] !== ';') {
      out += ' ';
    }
    continue;
  }

  // String: preserve verbatim (respecting escapes)
  if (c === '"' || c === "'") {
    const quote = c;
    out += c;
    i++;
    while (i < n) {
      const s = css[i];
      out += s;
      if (s === '\\') { // escape: copy next char verbatim too
        i++;
        if (i < n) out += css[i];
        i++;
        continue;
      }
      i++;
      if (s === quote) break;
    }
    continue;
  }

  // Whitespace run -> single space
  if (isWs(c)) {
    let j = i;
    while (j < n && isWs(css[j])) j++;
    // Skip space entirely right after {, }, ; (or start of output)
    const prev = out.length ? out[out.length - 1] : '';
    if (prev === '' || prev === '{' || prev === '}' || prev === ';') {
      i = j;
      continue;
    }
    out += ' ';
    i = j;
    continue;
  }

  // Structural chars: strip whitespace we already emitted before them
  if (c === '{' || c === '}' || c === ';') {
    if (out.length && out[out.length - 1] === ' ') out = out.slice(0, -1);
    if (c === '}') {
      // drop a redundant trailing ; before }
      if (out.length && out[out.length - 1] === ';') out = out.slice(0, -1);
    }
    out += c;
    i++;
    continue;
  }

  out += c;
  i++;
}

out = out.trim();

// Sanity guards: never emit something obviously broken.
const openBraces = (out.match(/{/g) || []).length;
const closeBraces = (out.match(/}/g) || []).length;
if (openBraces !== closeBraces) {
  console.error(`minify-css: brace mismatch (${openBraces} vs ${closeBraces}); aborting`);
  process.exit(1);
}
if (!out.length) {
  console.error('minify-css: empty output; aborting');
  process.exit(1);
}

writeFileSync(outPath, out);
const before = Buffer.byteLength(css);
const after = Buffer.byteLength(out);
console.error(`minify-css: ${srcPath} ${before} -> ${after} bytes (-${before - after})`);
