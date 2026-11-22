"""Quantitative sets from the ETS Quant practice book and the Official Guide, ch. 6.

The words and formulas of each question are typed (private/scripts/book_quant_text.py);
this module adds what comes from the page itself:

  * the answer key, parsed from the book and checked against the typed choices;
  * the figures, cropped at the boxes given in the transcription;
  * the explanations, cropped as images from the "Answers and Explanations"
    pages — from the "Explanation" heading down to the closing
    "Strategy k: …" line(s) that every explanation of these books ends with
    (the Official Guide's data-interpretation explanations end on the text).

Used by build_official_sets.py.
"""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

from exam_quant import S as SCALE, Renderer, save, trim_v
from book_verbal import lines as text_lines, strip_marks

import book_quant_text as T  # private transcription

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "private" / "media" / "official-sets"
URL = "/private-media/official-sets"

QUANT_MIN_PER_Q = 40 / 25
DIRECTIONS = None  # filled from build_exams to avoid a circular import


# 1-based PDF pages.
QB_CHAPTERS = {
    "qb-arith": dict(title="Arithmetic", key=range(65, 66), expl=range(66, 79)),
    "qb-alg": dict(title="Algebra", key=range(87, 88), expl=range(88, 99)),
    "qb-geom": dict(title="Geometry", key=range(107, 108), expl=range(108, 119)),
    "qb-data": dict(title="Data Analysis", key=range(132, 133), expl=range(133, 153)),
}
QB_MIXED = {
    3: dict(id="qb-mixed-1", key=range(165, 166), expl=range(166, 187)),
    4: dict(id="qb-mixed-2", key=range(197, 198), expl=range(198, 213)),
    5: dict(id="qb-mixed-3", key=range(223, 224), expl=range(224, 243)),
}
OG_SETS = {
    "og-q1": dict(title="Quant Set 1 · Discrete questions", level="easy", set=1),
    "og-q2": dict(title="Quant Set 2 · Discrete questions", level="medium", set=2),
    "og-q3": dict(title="Quant Set 3 · Discrete questions", level="hard", set=3),
    "og-q4": dict(title="Quant Set 4 · Data Interpretation", level=None, set=4),
}
OG_KEY = range(247, 251)
OG_EXPL_PAGES = {1: range(252, 266), 2: range(265, 281), 3: range(280, 301), 4: range(300, 309)}


# ── Answer keys ───────────────────────────────────────────────────────────

def parse_key(doc, pages: range) -> dict[int, dict[int, str]]:
    """{set: {n: raw key text}}; a book chapter has a single set (1)."""
    out: dict[int, dict[int, str]] = {}
    cur = None
    n = None
    started = False
    for l in text_lines(doc, pages):
        p = strip_marks(l.plain).strip()
        if p.startswith("ANSWER KEY"):
            started = True
            continue
        if not started:
            continue
        if p.startswith("Answers and Explanations"):
            break
        m = re.match(r"^SET (\d)\.", p)
        if m:
            cur = out.setdefault(int(m.group(1)), {})
            n = None
            continue
        if cur is None:
            cur = out.setdefault(1, {})
        m = re.match(r"^(\d{1,2})\.\s*(.*)$", p)
        if m and l.x < 175:
            n = int(m.group(1))
            cur[n] = m.group(2)
            continue
        if n is not None:
            cur[n] = (cur[n] + " " + p).strip()
    return out


def _alnum(s: str) -> str:
    s = re.sub(r"\\(frac|dfrac|sqrt|left|right|cdot|times|le|ge|ne|ldots|cdots|text|mathrm)", " ", s)
    s = s.replace("π", "pi").replace("−", "-")
    return re.sub(r"[^a-z0-9]", "", s.lower())


def answer_for(n: int, item: dict, raw: str, label: str) -> dict:
    t = item["t"]
    letters = re.findall(r"Choice ([A-J])", raw)
    if "ans" in item:
        a = item["ans"]
        return {"fraction": list(a)} if t == "NEF" else {"value": a} if t == "NE" else {"choices": list(a)}
    if t == "QC":
        assert len(letters) == 1 and letters[0] in "ABCD", (label, n, raw)
        return {"choice": letters[0]}
    if t in ("PS", "MA"):
        assert letters, (label, n, raw)
        ids = "ABCDEFGHIJ"[: len(item["choices"])]
        assert all(x in ids for x in letters), (label, n, letters, item["choices"])
        if t == "PS":
            assert len(letters) == 1, (label, n, raw)
        # The key repeats each choice's text: compare where it is plain text.
        for x in letters:
            m = re.search(rf"Choice {x}:\s*(.*?)(?=(?:AND\s*)?Choice [A-J]:|$)", raw)
            got = _alnum(m.group(1)) if m else ""
            want = _alnum(item["choices"][ord(x) - 65])
            if got and want and got[:12] != want[:12] and not (set(got) - set("0123456789")) <= set():
                print(f"    ? {label} Q{n} {x}: key '{m.group(1).strip()}' vs typed '{item['choices'][ord(x) - 65]}'")
        return {"choices": letters}
    if t == "NE":
        m = re.match(r"^\s*(-?[\d,]*\.?\d+)", raw)
        assert m, (label, n, raw)
        return {"value": float(m.group(1).replace(",", ""))}
    raise AssertionError((label, n, "fraction needs ans", raw))


# ── Explanations ──────────────────────────────────────────────────────────

def explanation_spans(doc, pages: range, wanted: list[int], after: str | None = None,
                      before: str | None = None) -> dict[int, tuple[tuple[int, float], tuple[int, float]]]:
    """{n: ((page, y_start), (page, y_end))} for each question's explanation.
    `after` / `before`: regexes of the lines that open and close the set when
    several sets share pages."""
    ls = text_lines(doc, pages)
    if after:
        i = next(k for k, l in enumerate(ls) if re.match(after, strip_marks(l.plain).strip()))
        ls = ls[i + 1:]
    if before:
        j = next((k for k, l in enumerate(ls) if re.match(before, strip_marks(l.plain).strip())), len(ls))
        ls = ls[:j]
    key = lambda l: (l.page, l.y)
    # One "Explanation" heading per question, in order (question numbers are
    # sometimes missing from the text layer, the headings never are).
    labels = [l for l in ls if strip_marks(l.plain).strip() == "Explanation" and l.text.startswith("**")]
    if len(labels) != len(wanted):
        print(f"    ! {len(labels)} explanation headings for {len(wanted)} questions")
    out = {}
    for i, n in enumerate(wanted[: len(labels)]):
        label = labels[i]
        nxt = labels[i + 1] if i + 1 < len(labels) else None
        inside = [l for l in ls if key(l) > key(label) and (nxt is None or key(l) < key(nxt))]
        after = [l for l in inside if key(l) > key(label)]
        strat = [l for l in after if re.match(r"^Strateg(y|ies) \d+", strip_marks(l.plain).strip())]
        if strat:
            last = strat[-1]
            end = (last.page, last.y + last.size + 3)
            # a strategy title may wrap onto the next line
            for l in after:
                if key(l) > key(last) and l.page == last.page and l.y - last.y < last.size * 1.6 and abs(l.x - last.x) < 30:
                    end = (l.page, l.y + l.size + 3)
        else:
            # Ends on the text: last line at the explanation's left margin
            # before a gap or a "Questions … are based on" banner.
            body = []
            for l in after:
                p = strip_marks(l.plain).strip()
                if re.match(r"^(Questions? \d+|For the following question|(Easy|Medium|Hard) Question)", p):
                    break
                if body and l.page == body[-1].page and l.y - body[-1].y > 40:
                    break
                body.append(l)
            if not body:
                continue
            end = (body[-1].page, body[-1].y + body[-1].size + 3)
        out[n] = ((label.page, label.y + label.size + 3), end)
    return out


# ── Building a section ────────────────────────────────────────────────────

class BookRenderer(Renderer):
    """Like exam_quant's, but with these books' running header/footer cut off
    when a crop runs across a page break."""

    def strip(self, a, b, whiten=(), x0=56.0, x1=556.0):  # noqa: D401
        parts = []
        for p in range(a[0], b[0] + 1):
            im = self.page(p)
            ya = a[1] if p == a[0] else 46
            yb = b[1] if p == b[0] else 728
            if yb - ya < 2:
                continue
            piece = trim_v(im.crop((int(x0 * SCALE), int(max(0, ya) * SCALE), int(x1 * SCALE), int(yb * SCALE))), pad=4)
            if piece is not None:
                parts.append(piece)
        if not parts:
            return None
        out = Image.new("RGB", (parts[0].width, sum(q.height for q in parts)), "white")
        y = 0
        for q in parts:
            out.paste(q, (0, y))
            y += q.height
        return trim_v(out)


def build_section(doc, set_id: str, items_tx: dict, raw_key: dict[int, str], expl_pages: range,
                  sid: str, number: int, difficulty: str | None = None,
                  bounds: tuple[str | None, str | None] = (None, None),
                  crop_x: tuple[float, float] = (110, 575)) -> tuple[dict, dict]:
    from build_exams import DIRECTIONS as D
    rend = BookRenderer(doc)
    out_dir = MEDIA / set_id
    prefix = f"{URL}/{set_id}"

    def crop(box, name: str) -> dict:
        p, x0, y0, x1, y1 = box
        im = rend.strip((p, y0), (p, y1), x0=x0, x1=x1)
        assert im is not None, (set_id, name, box)
        return {"src": f"{prefix}/{name}", **save(im, out_dir / name)}

    ns = sorted(items_tx)
    missing = sorted(set(raw_key) - set(ns))
    assert not missing, (set_id, "not transcribed", missing)
    spans = explanation_spans(doc, expl_pages, ns, *bounds)
    exhibits: dict[str, dict] = {}
    items, keys = [], {}
    for n in ns:
        tx = items_tx[n]
        t = tx["t"]
        item: dict = {"n": n, "type": {"QC": "QC", "PS": "PS", "MA": "PS", "NE": "NE", "NEF": "NE"}[t],
                      "format": {"QC": "single", "PS": "single", "MA": "multi", "NE": "numeric", "NEF": "fraction"}[t]}
        for f in ("common", "a", "b", "stem", "label", "unit", "table"):
            if f in tx:
                item[f] = tx[f]
        if "choices" in tx:
            item["choices"] = [{"id": "ABCDEFGHIJ"[i], "text": c} for i, c in enumerate(tx["choices"])]
        if "fig" in tx:
            item["figure"] = crop(tx["fig"], f"q{n}-fig.webp")
        if "group" in tx:
            first = str(tx["group"])
            if first not in exhibits:
                g = items_tx[tx["group"]]
                ex: dict = {}
                if "exhibit" in g:
                    boxes = g["exhibit"] if isinstance(g["exhibit"], list) else [g["exhibit"]]
                    ex["img"] = crop(boxes[0], f"exhibit-{first}.webp")
                    for k, b in enumerate(boxes[1:], start=2):
                        ex[f"img{k}"] = crop(b, f"exhibit-{first}-{k}.webp")
                if "exhibitTitle" in g:
                    ex["title"] = g["exhibitTitle"]
                exhibits[first] = ex
            item["exhibit"] = first
        assert ("a" in item and "b" in item) if t == "QC" else "stem" in item, (set_id, n)
        ans = answer_for(n, tx, raw_key.get(n, ""), set_id)
        expl = None
        if n in spans:
            a, b = spans[n]
            im = rend.strip(a, b, x0=crop_x[0], x1=crop_x[1])
            if im is not None:
                expl = {"src": f"{prefix}/e{n}.webp", **save(im, out_dir / f"e{n}.webp", quality=80)}
        if expl is None:
            print(f"    ! {set_id} Q{n}: no explanation found")
        entry = {"answer": ans, "p": None, "explanation": expl}
        level = tx.get("level", difficulty)
        if level:
            entry["difficulty"] = level
        items.append(item)
        keys[str(n)] = entry
    section = {"id": sid, "number": number, "kind": "quant", "title": "Quantitative Reasoning",
               "minutes": max(5, round(len(items) * QUANT_MIN_PER_Q)), "directions": D["quant"],
               "exhibits": exhibits, "items": items}
    return section, keys


# ── Entry points (called by build_official_sets.py) ──────────────────────

def qb_chapter_sets(doc):
    res = []
    for set_id, cfg in QB_CHAPTERS.items():
        if set_id not in T.S:
            print(f"  ({set_id} not transcribed yet)")
            continue
        raw = parse_key(doc, cfg["key"])[1]
        section, k = build_section(doc, set_id, T.S[set_id]["items"], raw, cfg["expl"], "s1", 1)
        meta = {"id": set_id, "book": "quant", "measure": "quant", "group": "Quantitative Practice Questions",
                "title": cfg["title"]}
        res.append((set_id, meta, section, k))
    return res


def og_quant_sets(doc):
    res = []
    keys = parse_key(doc, OG_KEY)
    for set_id, cfg in OG_SETS.items():
        if set_id not in T.S:
            print(f"  ({set_id} not transcribed yet)")
            continue
        tx = T.S[set_id]
        n = cfg["set"]
        section, k = build_section(doc, set_id, tx["items"], keys[n], OG_EXPL_PAGES[n], "s1", 1,
                                   difficulty=cfg["level"], bounds=(rf"^SET {n}\.", rf"^SET {n + 1}\." if n < 4 else None),
                                   crop_x=(62, 560))
        meta = {"id": set_id, "book": "guide", "measure": "quant", "group": "Official Guide · Quant",
                "title": cfg["title"], **({"level": cfg["level"]} if cfg["level"] else {})}
        res.append((set_id, meta, section, k))
    return res


def qb_mixed(doc, test: int):
    cfg = QB_MIXED[test]
    if cfg["id"] not in T.S:
        return None
    raw = parse_key(doc, cfg["key"])[1]
    return build_section(doc, cfg["id"], T.S[cfg["id"]]["items"], raw, cfg["expl"], "s4", 4)
