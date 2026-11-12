#!/usr/bin/env python3
"""Luthonia build: put src/ back together into one index.html.

src/manifest.txt lists the parts in order (one path per line, relative to src/, '#' = comment).
Each part is copied byte for byte. Inside any part, a token  %%ASSET:assets/name.ext%%
is replaced by the base64 of that file (the part keeps the 'data:...;base64,' prefix itself).

Usage:
  python3 tools/build.py            # write index.html at the repo root
  python3 tools/build.py --check    # build in memory and fail if it differs from index.html
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'index.html')
TOKEN = re.compile(rb'%%ASSET:([A-Za-z0-9_./-]+)%%')


def parts():
    with open(os.path.join(SRC, 'manifest.txt'), encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                yield line


def asset(m):
    p = os.path.join(SRC, m.group(1).decode())
    with open(p, 'rb') as f:
        return base64.b64encode(f.read())


def build():
    out = []
    for p in parts():
        with open(os.path.join(SRC, p), 'rb') as f:
            out.append(TOKEN.sub(asset, f.read()))
    return b''.join(out)


if __name__ == '__main__':
    data = build()
    if '--check' in sys.argv:
        cur = open(OUT, 'rb').read() if os.path.exists(OUT) else b''
        if cur != data:
            print('index.html is NOT what src/ builds — run: python3 tools/build.py')
            sys.exit(1)
        print('ok: index.html matches src/ (%d bytes)' % len(data))
    else:
        with open(OUT, 'wb') as f:
            f.write(data)
        print('wrote index.html (%d bytes)' % len(data))
