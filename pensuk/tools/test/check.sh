#!/usr/bin/env bash
# เป็นสุข — quick syntax check before every commit.
#   1) node --check on the big inline <script> of index.html
#   2) node --check on r3d.js (as an ES module)
#   3) "swallowed statement" scan: a `// comment` placed MID-LINE swallows the rest of that line, which
#      silently merges statements. Symptom: one top-level statement suddenly spans > 300 lines.
# Usage: bash pensuk/tools/test/check.sh   (from the repo root)   — needs node; step 3 also needs `npm i -g typescript`
set -e
cd "$(dirname "$0")/../.."
python3 - <<'EOF'
import re
s = open('index.html', encoding='utf-8').read()
m = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S)
open('/tmp/pensuk_check.js', 'w', encoding='utf-8').write(max(m, key=len))
EOF
node --check /tmp/pensuk_check.js && echo "index.html: syntax OK"
cp r3d.js /tmp/pensuk_r3d.mjs && node --check /tmp/pensuk_r3d.mjs && echo "r3d.js: syntax OK"
if npm root -g >/dev/null 2>&1 && [ -d "$(npm root -g)/typescript" ]; then
node - <<'EOF'
const ts = require(require('child_process').execSync('npm root -g').toString().trim() + '/typescript');
const src = require('fs').readFileSync('/tmp/pensuk_check.js', 'utf8');
const sf = ts.createSourceFile('a.js', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let bad = 0;
for (const st of sf.statements){ const a = sf.getLineAndCharacterOfPosition(st.getStart()).line + 1, b = sf.getLineAndCharacterOfPosition(st.end).line + 1;
  if (b - a > 300){ bad++; console.log('⚠️ statement spans', a, '→', b, ':', src.split('\n')[a-1].slice(0, 100)); } }
console.log(bad ? `⚠️ ${bad} suspiciously long statement(s) — look for a // comment in the middle of a line` : 'comment-swallow scan: OK');
EOF
else echo "(skip comment-swallow scan: npm i -g typescript to enable)"; fi
