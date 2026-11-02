"""Build the Math Review exercise deck from the ETS "GRE Math Review" PDF.

    python3 -I scripts/content/build_math_course.py /path/to/GRE_Math_Review.pdf

The 69 exercises are typed text (math_text.py; formulas in KaTeX). The only
pictures are the figures some exercises refer to, cropped from the page and
written under private/media/math-review/. The lessons themselves are not reproduced:
the app's own Learn course covers the Math Review section by section (see
docs/COVERAGE.md for the audit).

Writes private/math-review.json (git-ignored).
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "private" / "scripts"))  # ETS transcriptions, private
import pymupdf as fitz  # noqa: E402
from math_text import E as EXERCISE_TEXT  # noqa: E402
from pdfkit import Pdf, region, save_webp, stack  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "private" / "media" / "math-review"
MANIFEST = ROOT / "private" / "math-review.json"

X0, X1 = 60, 552  # content column, in points
MAX_W = 1000
GAP = 7  # pt trimmed above the next anchor so its heading never leaks in

# (id, title) — headings as printed; French labels live in the app.
PARTS = [
    ("arithmetic", "ARITHMETIC EXERCISES", "ANSWERS TO ARITHMETIC EXERCISES", r"^PART 1\."),
    ("algebra", "ALGEBRA EXERCISES", "ANSWERS TO ALGEBRA EXERCISES", r"^PART 2\."),
    ("geometry", "GEOMETRY EXERCISES", "ANSWERS TO GEOMETRY EXERCISES", r"^PART 3\."),
    ("data-analysis", "DATA ANALYSIS EXERCISES", "ANSWERS TO DATA ANALYSIS EXERCISES", r"^PART 4\."),
]


def one(pdf: Pdf, pattern: str, pages) -> tuple[int, float]:
    hits = pdf.find(pattern, pages, max_x=100)
    if not hits:
        raise SystemExit(f"anchor not found: {pattern}")
    p, l = hits[0]
    return p, l.y0


def main(pdf_path: str) -> None:
    pdf = Pdf(pdf_path, dpi=150)
    n_pages = 155

    # ── Anchors ─────────────────────────────────────────────────────────
    part_start = {pid: one(pdf, rx, range(1, n_pages + 1)) for pid, _, _, rx in PARTS}
    sections: list[dict] = []
    for p, l in pdf.find(r"^\d\.\d [A-Z]", range(3, n_pages + 1), max_x=100):
        m = re.match(r"^(\d)\.(\d) (.+)$", l.text)
        sections.append({"id": f"{m.group(1)}-{m.group(2)}", "part": int(m.group(1)),
                         "num": f"{m.group(1)}.{m.group(2)}", "title": m.group(3),
                         "at": (p, l.y0)})

    # A part's first section also carries the part's own heading and intro.
    for i, (pid, *_) in enumerate(PARTS, start=1):
        first = next(s for s in sections if s["part"] == i)
        first["at"] = part_start[pid]

    ex_head = {pid: one(pdf, f"^{ex}$", range(1, n_pages + 1)) for pid, ex, _, _ in PARTS}
    ans_head = {pid: one(pdf, f"^{an}$", range(1, n_pages + 1)) for pid, _, an, _ in PARTS}

    manifest: dict = {"parts": []}

    # ── Exercises: typed text; only the figure of an exercise is an image ──
    doc = fitz.open(pdf_path)
    CAPTION = re.compile(r"^(Geometry|Algebra|Data Analysis) Figure \d+")

    def statement_spans(pid: str) -> dict[int, tuple[tuple[int, float], tuple[int, float]]]:
        """{n: (start, end)} of each statement, as (page, y) pairs."""
        start, stop = ex_head[pid], ans_head[pid]
        anchors = []
        for p, l in pdf.find(r"^Exercise \d+\.", range(start[0], stop[0] + 1), max_x=100):
            if start <= (p, l.y0) < stop:
                anchors.append((int(re.match(r"^Exercise (\d+)", l.text).group(1)), p, l.y0))
        anchors.sort(key=lambda a: (a[1], a[2]))
        spans = {}
        for i, (n, p, y) in enumerate(anchors):
            end = (anchors[i + 1][1], anchors[i + 1][2] - GAP) if i + 1 < len(anchors) else (stop[0], stop[1] - GAP)
            spans[n] = ((p, y - 2), end)
        return spans

    def figure_of(start, end) -> dict | None:
        """The figure inside one statement: pictures and drawings big enough
        to be a figure, plus the short labels and caption around them."""
        for p in range(start[0], end[0] + 1):
            y0 = start[1] if p == start[0] else 56
            y1 = end[1] if p == end[0] else 740
            pg = doc[p - 1]
            rects = [fitz.Rect(b["bbox"]) for b in pg.get_text("dict")["blocks"]
                     if b["type"] == 1 and y0 <= b["bbox"][1] and b["bbox"][3] <= y1 + 2
                     and (b["bbox"][3] - b["bbox"][1] >= 40 or b["bbox"][2] - b["bbox"][0] >= 60)]
            rects += [d["rect"] for d in pg.get_drawings()
                      if y0 - 2 <= d["rect"].y0 and d["rect"].y1 <= y1 + 2
                      and (d["rect"].width >= 50 or d["rect"].height >= 50)]
            if not rects:
                continue
            u = fitz.Rect(rects[0])
            for r in rects[1:]:
                u |= r
            box = fitz.Rect(u)
            for b in pg.get_text("dict")["blocks"]:
                if b["type"] != 0:
                    continue
                for l in b["lines"]:
                    t = "".join(sp["text"] for sp in l["spans"]).strip()
                    lb = fitz.Rect(l["bbox"])
                    near = lb.y1 >= u.y0 - 16 and lb.y0 <= u.y1 + 34 and lb.x1 >= u.x0 - 30 and lb.x0 <= u.x1 + 30
                    if t and near and y0 <= lb.y0 <= y1 and ((CAPTION.match(t) and lb.y0 >= u.y1 - 2) or lb.width < 110):
                        box |= lb
            return {"page": p, "box": (box.x0 - 4, box.y0 - 4, box.x1 + 4, box.y1 + 4)}
        return None

    for i, (pid, _, _, _) in enumerate(PARTS, start=1):
        spans = statement_spans(pid)
        texts = EXERCISE_TEXT[pid]
        assert sorted(spans) == sorted(texts), (pid, sorted(spans), sorted(texts))
        exercises = []
        for n in sorted(texts):
            t = texts[n]
            item = {"n": n, "q": t["q"], "a": t["a"]}
            if "[[figure]]" in t["q"]:
                fig = figure_of(*spans[n])
                assert fig, (pid, n)
                x0, y0, x1, y1 = fig["box"]
                im = pdf.crop(fig["page"], y0, y1, x0, x1)
                w, h = save_webp(im, OUT_DIR / "exercises" / pid / f"fig{n}.webp", 900)
                item["figure"] = {"src": f"/private-media/math-review/exercises/{pid}/fig{n}.webp", "w": w, "h": h}
            exercises.append(item)
        print(f"exercises {pid}: {len(exercises)}")
        manifest["parts"].append({
            "id": pid,
            "exercises": exercises,
        })

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n")
    print("wrote", MANIFEST)


if __name__ == "__main__":
    main(sys.argv[1])
