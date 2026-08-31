#!/bin/bash
ok=0; bad=0
chk() { if [ -e "$1" ]; then echo "  ok   $1"; ok=$((ok+1)); else echo "  FALTA $1"; bad=$((bad+1)); fi; }

echo "== Raiz =="
for f in .gitignore LICENSE README.md wrangler.jsonc public; do chk "$f"; done

echo "== HTML =="
for f in index beats kits vsts videos kit-luvme kit-summer 404; do chk "public/$f.html"; done

echo "== JS =="
for f in main dom player beats kits vsts videos; do chk "public/js/$f.js"; done

echo "== Datos =="
for f in beats kits vsts; do chk "public/data/$f.json"; done

echo "== Assets =="
for f in css/style.css favicon.ico favicon-16x16.png favicon-32x32.png \
         apple-touch-icon.png og-image.png images audio; do chk "public/$f"; done

echo "== Nada suelto donde no toca =="
[ -z "$(ls public/*.js 2>/dev/null)" ] && echo "  ok   sin .js en public/" || { echo "  ERROR .js suelto en public/"; bad=$((bad+1)); }
[ -z "$(ls public/*.json 2>/dev/null)" ] && echo "  ok   sin .json en public/" || { echo "  ERROR .json suelto en public/"; bad=$((bad+1)); }
[ -z "$(ls public/js/*.json 2>/dev/null)" ] && echo "  ok   sin .json en js/" || { echo "  ERROR .json en js/"; bad=$((bad+1)); }

echo "== Rutas de los datos =="
miss=0
for f in $(grep -oh '"/\(images\|audio\)/[^"]*"' public/data/*.json | tr -d '"' | sort -u); do
  [ -f "public$f" ] || { echo "  FALTA public$f"; miss=$((miss+1)); }
done
[ $miss -eq 0 ] && echo "  ok   todas las rutas apuntan a archivos reales"
bad=$((bad+miss))

echo "== Seguridad =="
grep -rl "AIza" public/ 2>/dev/null && { echo "  ERROR clave de API en public/"; bad=$((bad+1)); } || echo "  ok   sin claves en public/"
grep -q "node_modules" .gitignore && echo "  ok   node_modules ignorado" || { echo "  ERROR node_modules sin ignorar"; bad=$((bad+1)); }
git status --short | grep -q "node_modules\|\.wrangler" && { echo "  ERROR basura en git"; bad=$((bad+1)); } || echo "  ok   git limpio"

echo
[ $bad -eq 0 ] && echo "TODO CORRECTO ($ok comprobaciones)" || echo "$bad PROBLEMAS"
