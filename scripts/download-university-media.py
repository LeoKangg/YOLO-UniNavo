#!/usr/bin/env python3
"""Restore locally hosted university images from the checked-in provenance manifest.

Usage: python3 scripts/download-university-media.py
The script preserves existing assets, waits between requests, and stops on HTTP429.
Re-check school identity, captions, and licenses before changing manifest entries.
"""
import json
from pathlib import Path
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/data/university-media.json'


def main():
    media = json.loads(MANIFEST.read_text())
    failures = []
    with tempfile.TemporaryDirectory(prefix='uninavo-media-') as directory:
        body = Path(directory) / 'image'
        headers = Path(directory) / 'headers'
        for school_id, pair in media.items():
            for kind, item in pair.items():
                destination = ROOT / 'public' / item['src']
                if destination.exists():
                    continue
                result = subprocess.run(
                    ['curl', '-L', '-s', '--max-time', '30', '-D', str(headers),
                     '-o', str(body), '-w', '%{http_code}', item['originalUrl']],
                    capture_output=True, text=True, check=False,
                )
                if result.stdout.strip() == '429':
                    print('Rate limited; honor the Retry-After header before rerunning.')
                    print(headers.read_text())
                    return 2
                if result.returncode == 0 and result.stdout.strip() == '200':
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    destination.write_bytes(body.read_bytes())
                    print(f'Saved {school_id} {kind}')
                else:
                    failures.append(f'{school_id} {kind}: HTTP {result.stdout}')
                time.sleep(5.2)
    for failure in failures:
        print(failure)
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
