#!/usr/bin/env python3
"""Write newgame/version.json for the in-game update check.
   python3 newgame/tools/make-version.py "สิ่งที่เปลี่ยน 1" "สิ่งที่เปลี่ยน 2" ...
   Reads APP_VER from src/data.js · lists every file the game loads (the client re-fetches them before reloading)."""
import json, re, sys, pathlib
G = pathlib.Path(__file__).resolve().parents[1]
ver = re.search(r"export const APP_VER = '([\d.]+)'", (G / 'src/data.js').read_text()).group(1)
files = ['index.html', 'manifest.webmanifest'] + sorted(str(p.relative_to(G)) for p in list((G / 'src').glob('*.js')) + list((G / 'lib').rglob('*.js')))
old = {}
try: old = json.loads((G / 'version.json').read_text())
except Exception: pass
notes = sys.argv[1:] or (old.get('notes', []) if old.get('v') == ver else [])
(G / 'version.json').write_text(json.dumps({'v': ver, 'notes': notes, 'files': files}, ensure_ascii=False, indent=1) + '\n')
print('version.json', ver, len(files), 'files', len(notes), 'notes')
