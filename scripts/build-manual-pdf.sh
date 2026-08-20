#!/usr/bin/env sh
# Concatena o manual técnico modular e gera docs/MANUAL-TECNICO.pdf
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$ROOT/docs"
BUILD="$DOCS/.manual-build"
CONCAT="$BUILD/MANUAL-TECNICO-full.md"
OUT_PDF="$DOCS/MANUAL-TECNICO.pdf"
ASSETS="$DOCS/assets/manual"

mkdir -p "$BUILD" "$ASSETS"

ORDER="
$DOCS/MANUAL-TECNICO.md
$DOCS/manual-tecnico/00-introducao.md
$DOCS/manual-tecnico/01-stack.md
$DOCS/manual-tecnico/02-arquitetura-backend.md
$DOCS/manual-tecnico/03-organizacao-codigo.md
$DOCS/manual-tecnico/04-configuracao.md
$DOCS/manual-tecnico/05-logging.md
$DOCS/manual-tecnico/06-api-swagger.md
$DOCS/manual-tecnico/07-autenticacao-rbac.md
$DOCS/manual-tecnico/08-banco-dados.md
$DOCS/manual-tecnico/09-frontend.md
$DOCS/manual-tecnico/10-devops-seguranca.md
"

for f in "$DOCS"/manual-tecnico/modulos/*.md; do
  [ -f "$f" ] && ORDER="$ORDER
$f"
done

ORDER="$ORDER
$DOCS/manual-tecnico/apendices/glossario.md
$DOCS/manual-tecnico/apendices/matriz-integracao.md
$DOCS/manual-tecnico/apendices/rotas-auxiliares.md
"

: > "$CONCAT"
for f in $ORDER; do
  if [ -f "$f" ]; then
    echo "" >> "$CONCAT"
    echo "---" >> "$CONCAT"
    echo "" >> "$CONCAT"
    cat "$f" >> "$CONCAT"
  fi
done

echo "Concatenated manual -> $CONCAT ($(wc -l < "$CONCAT") lines)"

# Cópia para PDF: substitui blocos mermaid por nota (md-to-pdf não renderiza mermaid nativamente)
PDF_MD="$BUILD/MANUAL-TECNICO-pdf.md"
python3 - "$CONCAT" "$PDF_MD" <<'PY'
import re, sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
def repl(m):
    title = m.group(1).strip().split("\n", 1)[0][:80]
    return f"\n> **Diagrama (ver Markdown):** `{title}...`\n\n"
text = re.sub(r"```mermaid\n(.*?)```", repl, text, flags=re.DOTALL)
open(dst, "w", encoding="utf-8").write(text)
print(f"PDF source prepared: {dst}")
PY

# Optional: render mermaid blocks to PNG (requires @mermaid-js/mermaid-cli)
if command -v mmdc >/dev/null 2>&1; then
  echo "Rendering Mermaid diagrams with mmdc..."
  python3 - "$CONCAT" "$ASSETS" <<'PY'
import re, sys, hashlib, subprocess
from pathlib import Path

md_path, assets_dir = Path(sys.argv[1]), Path(sys.argv[2])
text = md_path.read_text(encoding="utf-8")
assets_dir.mkdir(parents=True, exist_ok=True)
idx = 0

def render_block(code: str) -> str:
    global idx
    idx += 1
    h = hashlib.sha256(code.encode()).hexdigest()[:12]
    mmd = assets_dir / f"diagram_{h}.mmd"
    png = assets_dir / f"diagram_{h}.png"
    mmd.write_text(code, encoding="utf-8")
    subprocess.run(["mmdc", "-i", str(mmd), "-o", str(png), "-b", "white"], check=False)
    if png.exists():
        rel = png.relative_to(md_path.parent)
        return f"![diagram]({rel})"
    return f"```mermaid\n{code}\n```"

pattern = re.compile(r"```mermaid\n(.*?)```", re.DOTALL)
new_text = pattern.sub(lambda m: render_block(m.group(1).strip()), text)
md_path.write_text(new_text, encoding="utf-8")
print(f"Processed {idx} mermaid blocks")
PY
fi

generate_pandoc() {
  if ! command -v pandoc >/dev/null 2>&1; then
    return 1
  fi
  echo "Generating PDF with pandoc..."
  pandoc "$PDF_MD" -o "$OUT_PDF" \
    --from=markdown \
    --pdf-engine="${PDF_ENGINE:-pdflatex}" \
    -V geometry:margin=2.5cm \
    -V documentclass=report \
    --toc \
    --toc-depth=3 \
    --number-sections \
    2>/dev/null || pandoc "$PDF_MD" -o "$OUT_PDF" --from=markdown -V geometry:margin=2.5cm --toc
}

generate_chrome_pdf() {
  CHROME=""
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "google-chrome" \
    "chromium"; do
    if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then
      CHROME="$c"
      break
    fi
  done
  if [ -z "$CHROME" ]; then
    return 1
  fi
  HTML="$BUILD/MANUAL-TECNICO.html"
  echo "Generating HTML + PDF via Chrome headless..."
  python3 - "$PDF_MD" "$HTML" <<'PY'
import sys
from pathlib import Path
import markdown
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension

md_path, html_path = Path(sys.argv[1]), Path(sys.argv[2])
body = md_path.read_text(encoding="utf-8")
html_body = markdown.markdown(
    body,
    extensions=[TableExtension(), FencedCodeExtension(), "toc"],
    output_format="html5",
)
doc = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Manual Técnico — Espaço Terapia OS</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
         line-height: 1.45; max-width: 920px; margin: 2rem auto; padding: 0 1rem; color: #111; }}
  h1,h2,h3 {{ page-break-after: avoid; }}
  pre, code {{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85em; }}
  pre {{ background: #f4f4f5; padding: 0.75rem; overflow-x: auto; }}
  table {{ border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9em; }}
  th, td {{ border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }}
  blockquote {{ border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #444; }}
  hr {{ border: none; border-top: 1px solid #ddd; margin: 2rem 0; }}
  @media print {{ body {{ max-width: none; }} }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""
html_path.write_text(doc, encoding="utf-8")
print(f"HTML: {html_path} ({len(doc)} bytes)")
PY
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$OUT_PDF" "file://${HTML}"
  [ -f "$OUT_PDF" ]
}

generate_md_to_pdf() {
  echo "Generating PDF with md-to-pdf (npx)..."
  cd "$ROOT"
  npx --yes md-to-pdf@5.2.4 "$PDF_MD" \
    --basedir "$DOCS" \
    --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"18mm","right":"18mm"}}'
  GENERATED="${PDF_MD%.md}.pdf"
  if [ -f "$GENERATED" ]; then
    mv -f "$GENERATED" "$OUT_PDF"
  fi
}

if generate_pandoc; then
  :
elif generate_chrome_pdf; then
  :
elif generate_md_to_pdf; then
  :
else
  echo "ERROR: Install pandoc+latex, Google Chrome, or ensure npx/md-to-pdf works." >&2
  exit 1
fi

if [ -f "$OUT_PDF" ]; then
  echo "OK: $OUT_PDF ($(du -h "$OUT_PDF" | cut -f1))"
else
  echo "ERROR: PDF not created" >&2
  exit 1
fi
