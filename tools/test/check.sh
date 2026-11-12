#!/usr/bin/env bash
# Luthonia — quick checks before every commit (run from anywhere):  bash tools/test/check.sh
#   1) index.html is exactly what src/ builds (python3 tools/build.py --check)
#   2) node --check on every inline <script> of index.html
#   3) "swallowed statement" scan: a `// comment` placed MID-LINE eats the rest of that line and silently merges
#      statements → one top-level statement of the game IIFE suddenly spans > 300 lines (today's longest: ~270)
#   4) VER in index.html == VERSION in sw.js
#   5) no personal e-mail address in anything that goes on the web
set -e
cd "$(dirname "$0")/../.."
TMP="${TMPDIR:-/tmp}/luthonia_check"; mkdir -p "$TMP"
python3 tools/build.py --check
python3 - "$TMP" <<'EOF'
import re, sys
s = open('index.html', encoding='utf-8').read()
m = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S)
for i, x in enumerate(m):
    open('%s/s%d.js' % (sys.argv[1], i), 'w', encoding='utf-8').write(x)
open('%s/n' % sys.argv[1], 'w').write(str(len(m)))
EOF
for i in $(seq 0 $(( $(cat "$TMP/n") - 1 ))); do node --check "$TMP/s$i.js"; done
echo "scripts: syntax OK ($(cat "$TMP/n") inline scripts)"
NODE_PATH="$(npm root -g)" node - "$TMP/s0.js" <<'EOF'
let ts; try { ts = require('typescript') } catch (e) { console.log('(skip comment-swallow scan: npm i -g typescript)'); process.exit(0) }
const src = require('fs').readFileSync(process.argv[2], 'utf8');
const sf = ts.createSourceFile('a.js', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let body = null; ts.forEachChild(sf, function f(n) { if (!body && ts.isFunctionExpression(n)) { body = n.body; return } ts.forEachChild(n, f) });
let bad = 0;
for (const st of body.statements) { const a = sf.getLineAndCharacterOfPosition(st.getStart()).line + 1, b = sf.getLineAndCharacterOfPosition(st.end).line + 1;
  if (b - a > 300) { bad++; console.log('⚠️ statement spans', a, '→', b, ':', src.split('\n')[a - 1].slice(0, 100)) } }
if (bad) { console.log(`⚠️ ${bad} suspiciously long statement(s) — look for a // comment in the middle of a line`); process.exit(1) }
console.log('comment-swallow scan: OK');
EOF
V=$(grep -oE "const VER='[^']+'" index.html | head -1 | sed -E "s/.*'(.*)'/\1/")
W=$(grep -oE "kpd-v[0-9.]+" sw.js | head -1 | sed 's/kpd-v//')
[ "$V" = "$W" ] || { echo "❌ VER $V in index.html but VERSION kpd-v$W in sw.js"; exit 1; }
echo "version: $V (index.html = sw.js)"
if grep -rIlE "[A-Za-z0-9._%+-]+@(gmail|hotmail|yahoo|outlook|icloud|live)\.[a-z.]+" index.html sw.js manifest.webmanifest src >/dev/null; then
  echo "❌ personal e-mail address found:"; grep -rIlE "[A-Za-z0-9._%+-]+@(gmail|hotmail|yahoo|outlook|icloud|live)\.[a-z.]+" index.html sw.js manifest.webmanifest src; exit 1; fi
echo "e-mail scan: OK"
echo "✅ all checks passed"
