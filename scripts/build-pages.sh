#!/usr/bin/env bash
set -euo pipefail

output_dir="dist"

public_files=(
  "_headers"
  "_redirects"
  "404.html"
  "about.html"
  "android-chrome-192x192.png"
  "android-chrome-512x512.png"
  "apple-touch-icon.png"
  "books.html"
  "contact.html"
  "favicon-16x16.png"
  "favicon-32x32.png"
  "favicon-48x48.png"
  "favicon-96x96.png"
  "favicon.ico"
  "google01648345559ef45d.html"
  "index.html"
  "llms.txt"
  "main.js"
  "methodology.html"
  "privacy.html"
  "robots.txt"
  "site.webmanifest"
  "sitemap.xml"
  "sources.html"
  "styles.css"
  "support-policy.html"
  "support.html"
  "terms.html"
  "thank-you.html"
)

public_dirs=(
  "assets"
)

rm -rf "$output_dir"
mkdir -p "$output_dir"

for file in "${public_files[@]}"; do
  install -m 0644 "$file" "$output_dir/$file"
done

for dir in "${public_dirs[@]}"; do
  mkdir -p "$output_dir/$dir"
  cp -R "$dir"/. "$output_dir/$dir/"
done

# Large source-original PNGs are kept in the repo (source of truth for the
# JPG/SVG variants that are actually referenced) but are NOT referenced by any
# HTML/CSS/JS. Prune them from the deployed output so ~4 MB of unused originals
# are never shipped or served publicly. rm -f is safe if a file is already gone.
unused_assets=(
  "assets/books/essentials-shafii-worship-vol1.png"
  "assets/books/essentials-shafii-worship-vol2.png"
  "assets/images/author-photo.png"
  "assets/logo/usullearning-logo.png"
)

for asset in "${unused_assets[@]}"; do
  rm -f "$output_dir/$asset"
done

# Minify the deployed stylesheet only. Source styles.css stays readable - the
# minifier reads the source and writes the minified result into dist. If node is
# unavailable or the minify step fails for any reason, fall back to the plain
# copy already staged above so the build never breaks.
if command -v node >/dev/null 2>&1; then
  if node scripts/minify-css.mjs styles.css "$output_dir/styles.css.min"; then
    mv -f "$output_dir/styles.css.min" "$output_dir/styles.css"
  else
    echo "build-pages: CSS minify failed; shipping un-minified styles.css" >&2
    rm -f "$output_dir/styles.css.min"
  fi
else
  echo "build-pages: node not found; shipping un-minified styles.css" >&2
fi

blocked_paths="$(
  find "$output_dir" \
    \( \
      -name ".git" -o \
      -name ".github" -o \
      -name ".env" -o \
      -name ".env.*" -o \
      -name "README.md" -o \
      -name "SECURITY.md" -o \
      -name "CONTENT-LICENSE.md" -o \
      -name "LICENSE" -o \
      -name "NOTICE" -o \
      -name "package.json" -o \
      -name "package-lock.json" -o \
      -name "pnpm-lock.yaml" -o \
      -name "yarn.lock" -o \
      -name "wrangler*.toml" -o \
      -name "worker.js" -o \
      -name "docs" \
    \) -print
)"

if [[ -n "$blocked_paths" ]]; then
  printf 'Blocked non-public deployment files in %s:\n%s\n' "$output_dir" "$blocked_paths" >&2
  exit 1
fi
