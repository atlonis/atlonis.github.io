#!/usr/bin/env bash
# Собирает витрину и все эксперименты в _site/ для GitHub Pages.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/_site"
rm -rf "$OUT"; mkdir -p "$OUT"
cp "$ROOT/index.html" "$ROOT/experiments.json" "$OUT/"
[ -d "$ROOT/assets" ] && cp -R "$ROOT/assets" "$OUT/"
for dir in "$ROOT"/*/; do
  name="$(basename "$dir")"
  case "$name" in _site|scripts|assets|node_modules|docs) continue;; esac
  if [ -f "$dir/package.json" ]; then
    echo "==> build $name"
    (cd "$dir" && npm ci && npm run build)
    mkdir -p "$OUT/$name"; cp -R "$dir/dist/." "$OUT/$name/"
  elif [ -f "$dir/index.html" ]; then
    echo "==> copy $name"
    mkdir -p "$OUT/$name"; cp -R "$dir/." "$OUT/$name/"
  else
    echo "==> skip $name (нет package.json и index.html)"
  fi
done
touch "$OUT/.nojekyll"
echo "done: $OUT"
