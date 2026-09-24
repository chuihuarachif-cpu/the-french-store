#!/usr/bin/env bash
# Deploys design-lab/ ONLY to its own Cloudflare Pages project (never production).
set -e
cd "$(dirname "$0")/.."
OUT=.lab-dist
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r design-lab/. "$OUT/"
rm -rf "$OUT/tests" "$OUT/README.md" "$OUT/ANTIGRAVITY_SCOPE.md" "$OUT/build-preview.mjs"
cat > "$OUT/_headers" <<H
/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: no-cache
H
printf 'User-agent: *\nDisallow: /\n' > "$OUT/robots.txt"
printf "/ /desktop.html 200
" > "$OUT/_redirects"
npx wrangler pages deploy "$OUT" --project-name french-store-lab --branch main --commit-dirty=true
