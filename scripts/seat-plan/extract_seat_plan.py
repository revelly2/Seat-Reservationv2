"""Regenerate lib/arena-layout.json from pdf/MASTER SEAT PLAN.pdf (AutoCAD export).

Usage:  python -I scripts/seat-plan/extract_seat_plan.py  (requires: pip install pymupdf)

Each seat is a 2.8pt circle stroked in its block's color with its seat number printed inside.
Rows are walked from each row-letter label (A = innermost) by following seat numbers 1..N
along the row's direction. Drawing quirks handled explicitly:
  - duplicate circles drawn on top of each other are merged,
  - a skipped number between adjacent seats (e.g. 32 -> 34) is allowed,
  - straight jumps across stairs/gaps are allowed, sharp jumps to another row are not,
  - a seat with a mistyped duplicate number takes the row's next free number (reported).
"""
import collections, json, math, os
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ROOT, 'pdf', 'MASTER SEAT PLAN.pdf')
OUT = os.path.join(ROOT, 'lib', 'arena-layout.json')

# drawing stroke color -> block code; display name, default price (PHP), map color
COLORS = {(1.0, 0.0, 0.0): 'BLK1', (0.8, 0.41, 0.16): 'BLK2', (1.0, 0.0, 1.0): 'BLK3', (0.0, 0.0, 1.0): 'BLK4',
          (1.0, 1.0, 0.0): 'BLK5', (0.0, 1.0, 0.0): 'BLK6', (0.0, 0.0, 0.0): 'BLK7', (0.0, 1.0, 1.0): 'VIP'}
BLOCKS = [('BLK1', 'BLK 1', 100, '#D64545'), ('BLK2', 'BLK 2', 150, '#C8692A'), ('BLK3', 'BLK 3', 100, '#B348B3'),
          ('BLK4', 'BLK 4', 75, '#3F5FC8'), ('BLK5', 'BLK 5', 100, '#C9A400'), ('BLK6', 'BLK 6', 100, '#3E9B4F'),
          ('BLK7', 'BLK 7', 75, '#5A5853'), ('VIP', 'VIP', 250, '#1F9BA6')]
COURT = (397.6, 263.7, 887.2, 525.9)  # outer court rectangle in drawing points

dist = lambda a, b: math.hypot(a['x'] - b['x'], a['y'] - b['y'])


def turn(p, c, n):
    a1 = math.atan2(c['y'] - p['y'], c['x'] - p['x'])
    a2 = math.atan2(n['y'] - c['y'], n['x'] - c['x'])
    return abs((math.degrees(a2 - a1) + 180) % 360 - 180)


def extract(page):
    raw, labels = [], []
    for g in page.get_drawings():
        r = g['rect']
        c = tuple(round(x, 2) for x in g['color']) if g.get('color') else None
        if c not in COLORS or ''.join(i[0] for i in g['items']) != 'cccc' or abs(r.width - r.height) > 0.3:
            continue
        pt = dict(block=COLORS[c], x=(r.x0 + r.x1) / 2, y=(r.y0 + r.y1) / 2)
        if abs(r.width - 2.8) < 0.15:
            raw.append(pt)
        elif 6 < r.width < 12:
            labels.append(pt)
    words = page.get_text('words')
    nums = [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2, int(w[4])) for w in words if w[4].isdigit()]
    letters = [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2, w[4]) for w in words if w[4] in 'ABCDEFGHI' and len(w[4]) == 1]
    for s in raw:
        n = min(nums, key=lambda n: (n[0] - s['x']) ** 2 + (n[1] - s['y']) ** 2)
        assert math.hypot(n[0] - s['x'], n[1] - s['y']) < 1.5, f'unlabeled seat {s}'
        s['num'] = n[2]
    rows = []
    for L in labels:
        t = min(letters, key=lambda t: (t[0] - L['x']) ** 2 + (t[1] - L['y']) ** 2)
        if math.hypot(t[0] - L['x'], t[1] - L['y']) < 3:
            rows.append(dict(L, row=t[2]))
    return raw, rows


def assign_rows(raw, labels):
    seats = []
    for s in raw:
        if not any(t['block'] == s['block'] and dist(t, s) < 1.0 for t in seats):
            seats.append(dict(s, row=None))
    print('merged duplicate circles:', len(raw) - len(seats))
    rows = {}
    for L in sorted(labels, key=lambda L: (L['block'], L['row'])):  # inner rows first
        blk = [s for s in seats if s['block'] == L['block'] and s['row'] is None]
        chain = [min((s for s in blk if s['num'] == 1), key=lambda s: dist(s, L))]
        while True:
            cur, ok = chain[-1], []
            for step in (1, 2):
                for n in (s for s in blk if s['num'] == cur['num'] + step and s not in chain):
                    d = dist(n, cur)
                    if len(chain) == 1:
                        good = d < 20
                    else:
                        t = turn(chain[-2], cur, n)
                        good = (d < 14 and t < 60) or (d < 140 and t < 12)
                    if good and (step == 1 or d < 14):
                        ok.append(n)
                if ok:
                    break
            if not ok:
                break
            chain.append(min(ok, key=lambda n: dist(n, cur)))
        for s in chain:
            s['row'] = L['row']
        rows[(L['block'], L['row'])] = chain
    for s in [s for s in seats if s['row'] is None]:
        near = min((t for t in seats if t['block'] == s['block'] and t['row']), key=lambda t: dist(t, s))
        chain = rows[(s['block'], near['row'])]
        nums = sorted(t['num'] for t in chain)
        missing = sorted(set(range(1, nums[-1] + 1)) - set(nums))
        assert dist(near, s) < 12 and len(missing) <= 1, f'cannot place seat {s}'
        new = (missing or [nums[-1] + 1])[0]
        print(f"relabeled {s['block']} row {near['row']}: printed {s['num']} -> {new}")
        s.update(num=new, row=near['row'])
        chain.append(s)
    return seats


def main():
    page = pymupdf.open(PDF)[0]
    seats = assign_rows(*extract(page))
    idx = {code: i for i, (code, *_) in enumerate(BLOCKS)}
    m = 12
    x0 = min(s['x'] for s in seats) - m
    y0 = min(s['y'] for s in seats) - m
    r1 = lambda v: round(v, 1)
    layout = {
        'source': 'pdf/MASTER SEAT PLAN.pdf (AutoCAD, second floor plan)',
        'width': r1(max(s['x'] for s in seats) + m - x0),
        'height': r1(max(s['y'] for s in seats) + m - y0),
        'court': {'x': r1(COURT[0] - x0), 'y': r1(COURT[1] - y0), 'w': r1(COURT[2] - COURT[0]), 'h': r1(COURT[3] - COURT[1])},
        'blocks': [{'code': c, 'name': n, 'defaultPrice': p, 'color': col} for c, n, p, col in BLOCKS],
        # [blockIndex, rowLetter, seatNumber, x, y]
        'seats': [[idx[s['block']], s['row'], s['num'], r1(s['x'] - x0), r1(s['y'] - y0)]
                  for s in sorted(seats, key=lambda s: (idx[s['block']], s['row'], s['num']))],
    }
    ids = {(b, r, n) for b, r, n, *_ in layout['seats']}
    assert len(ids) == len(layout['seats']), 'duplicate seat ids'
    print('seats per block:', dict(collections.Counter(BLOCKS[b][0] for b, *_ in layout['seats'])))
    with open(OUT, 'w') as f:
        json.dump(layout, f, separators=(',', ':'))
    print('wrote', OUT, len(layout['seats']), 'seats')


if __name__ == '__main__':
    main()
