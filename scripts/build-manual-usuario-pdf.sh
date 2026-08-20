#!/usr/bin/env sh
# Gera docs/MANUAL-USUARIO.pdf a partir dos capítulos Markdown (com imagens embutidas).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$ROOT/docs"
BUILD="$DOCS/.manual-usuario-build"
CONCAT="$BUILD/MANUAL-USUARIO-full.md"
OUT_PDF="$DOCS/MANUAL-USUARIO.pdf"

mkdir -p "$BUILD"

ORDER="$DOCS/manual-usuario/00-introducao.md"
for f in "$DOCS"/manual-tecnico/../manual-usuario/modulos/*.md; do
  [ -f "$f" ] && ORDER="$ORDER
$f"
done
# fixed order
ORDER="
$DOCS/manual-usuario/00-introducao.md
"
for n in $(ls "$DOCS/manual-usuario/modulos/"*.md 2>/dev/null | sort); do
  ORDER="$ORDER
$n"
done
ORDER="$ORDER
"

: > "$CONCAT"
for f in $DOCS/manual-usuario/00-introducao.md $(ls "$DOCS/manual-usuario/modulos/"*.md 2>/dev/null | sort); do
  [ -f "$f" ] || continue
  echo "" >> "$CONCAT"
  echo "---" >> "$CONCAT"
  echo "" >> "$CONCAT"
  cat "$f" >> "$CONCAT"
done

echo "Concatenated -> $CONCAT ($(wc -l < "$CONCAT") lines)"

HTML="$BUILD/MANUAL-USUARIO.html"
CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "google-chrome" "chromium"; do
  if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then
    CHROME="$c"
    break
  fi
done

if [ -z "$CHROME" ]; then
  echo "ERROR: Chrome não encontrado para gerar PDF." >&2
  exit 1
fi

python3 - "$CONCAT" "$HTML" "$DOCS" <<'PY'
import re, sys
from pathlib import Path
import markdown
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension

md_path, html_path, docs_root = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
body = md_path.read_text(encoding="utf-8")

def embed_images(text: str) -> str:
    def repl(m):
        alt, src = m.group(1), m.group(2)
        p = (docs_root / src).resolve()
        if not p.exists():
            return f'<p><em>[Imagem não encontrada: {src}]</em></p>'
        uri = p.as_uri()
        return f'<img src="{uri}" alt="{alt}" style="max-width:100%;border:1px solid #ddd;margin:1rem 0;" />'
    return re.sub(r'!\[([^\]]*)\]\((manual-usuario/screenshots/[^)]+)\)', repl, text)

body = embed_images(body)
html_body = markdown.markdown(
    body,
    extensions=[TableExtension(), FencedCodeExtension()],
    output_format="html5",
)
doc = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Manual de Utilização — Espaço Terapia OS</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
         line-height: 1.5; max-width: 960px; margin: 1.5rem auto; padding: 0 1rem; color: #111; font-size: 11pt; }}
  h1 {{ font-size: 1.6em; page-break-before: always; margin-top: 0; }}
  h1:first-of-type {{ page-break-before: avoid; }}
  h2 {{ font-size: 1.25em; margin-top: 1.2em; }}
  h3 {{ font-size: 1.1em; }}
  img {{ max-width: 100%; height: auto; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #ccc; padding: 0.35rem; }}
  blockquote {{ border-left: 4px solid #ccc; padding-left: 1rem; color: #444; }}
  hr {{ border: none; border-top: 1px solid #ddd; margin: 2rem 0; }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""
html_path.write_text(doc, encoding="utf-8")
print(f"HTML: {html_path}")
PY

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT_PDF" "file://${HTML}"

echo "OK: $OUT_PDF ($(du -h "$OUT_PDF" | cut -f1))"
