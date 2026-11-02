"""Cut the Quantitative Reasoning questions out of the Official Guide pages.

Why images: the math (fractions, roots, exponents) is drawn as vector glyphs
and the figures are rasters, so neither survives text extraction. Each
question is therefore cropped from its rendered page, then split into the
parts the interface treats differently:

  stem     everything above the answer controls — shown as an image
  choices  one crop per lettered choice — shown next to a native radio or
           checkbox, so the controls are the app's and the content is the book's
  box      the numeric-entry answer box, whitened out of the stem (the app
           draws its own input); its unit label is read off the crop by hand

Layout facts the cropper relies on (checked against the pages):
  * a question starts at a left-margin "N." line;
  * a figure meant for a question may sit ABOVE its number ("in the figure
    above"), between the previous question's controls and this number;
  * "Questions 17 to 20 are based on the following data." introduces a shared
    exhibit that precedes the first of those questions.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import pymupdf as fitz
from PIL import Image, ImageDraw

DPI = 200
S = DPI / 72.0
X0, X1 = 56, 556  # content column in points

NUM_X = (62, 82)
LETTER_X = (88, 112)

NOISE_RX = re.compile(
    r"^(For the following question|For each of Questions|Questions? \d+.*(based|following)|"
    r"Quantity [AB] is greater|The two quantities are equal|The relationship cannot|"
    r"Correct Answer|STOP\.|SECTION \d|Time\s*[—-])", re.I)


@dataclass
class Item:
    kind: str       # line | image | oval | rule
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str = ""
    noise: bool = False

    @property
    def lo(self) -> tuple[int, float]:
        return (self.page, self.y0)

    @property
    def hi(self) -> tuple[int, float]:
        return (self.page, self.y1)


def page_items(doc, p: int) -> list[Item]:
    pg = doc[p - 1]
    out: list[Item] = []
    for b in pg.get_text("dict")["blocks"]:
        x0, y0, x1, y1 = b["bbox"]
        if b["type"] == 1:
            if (y1 - y0) > 2.5:  # hairlines are verbal blanks
                out.append(Item("image", p, x0, y0, x1, y1))
            continue
        for l in b["lines"]:
            t = "".join(s["text"] for s in l["spans"])
            if t.strip():
                lx0, ly0, lx1, ly1 = l["bbox"]
                out.append(Item("line", p, lx0, ly0, lx1, ly1, t))
    for d in pg.get_drawings():
        r = d["rect"]
        # A full-width rule: the divider printed above some questions.
        if r.height <= 2.5 and r.width >= 300:
            out.append(Item("rule", p, r.x0, r.y0, r.x1, r.y1))
        # Answer-oval row of a quantitative comparison.
        if d.get("fill") == (1.0, 1.0, 1.0) and 138 <= r.width <= 148 and 11 <= r.height <= 20:
            out.append(Item("oval", p, r.x0, r.y0, r.x1, r.y1))
    out.sort(key=lambda i: (i.page, i.y0, i.x0))
    return out


@dataclass
class Q:
    n: int
    kind: str = "PS"            # QC | PS | NE
    multi: bool = False
    boxes: int = 1              # NE: 2 for a fraction
    top: tuple[int, float] = (0, 0)
    stem_end: tuple[int, float] = (0, 0)
    ctrl_end: tuple[int, float] = (0, 0)
    letters: list[Item] = field(default_factory=list)
    box: Item | None = None
    band: tuple[float, float] = (21.0, 7.0)
    clamp_end: tuple[int, float] = (0, 0)   # where the controls' own ink stops
    whiten: list = field(default_factory=list)   # (page, x0, y0, x1, y1) in points
    exhibit: tuple[int, int] | None = None   # group (first, last)


def is_noise(i: Item) -> bool:
    t = i.text.strip()
    if i.kind != "line":
        return False
    return i.noise or bool(NOISE_RX.match(t)) or (len(t) == 1 and t in "ABCD" and i.x0 < 92)


def locate(doc, pages: range, num_x=NUM_X) -> tuple[list[Item], dict[int, Item], Item | None]:
    items: list[Item] = []
    for p in pages:
        items += page_items(doc, p)
    # The numeric-entry instruction box sits between two questions.
    in_box = False
    seen_exact = False
    for it in items:
        if it.kind != "line":
            continue
        t = it.text.strip()
        if t.startswith("Questions 10 to 25 have several"):
            in_box, seen_exact = True, False
        if in_box:
            if re.match(r"^\d+\.", t):
                in_box = False
                continue
            it.noise = True
            if t.startswith("Enter the exact answer"):
                seen_exact = True
            if seen_exact and t.endswith("answer."):
                in_box = False
    nums: dict[int, Item] = {}
    n = 1
    started = False
    stop = None
    for it in items:
        t = it.text.strip()
        if it.kind != "line":
            continue
        if t.startswith("STOP.") and nums:
            stop = it
            break
        m = re.match(rf"^{n}\.(\s|$)", t)
        if m and num_x[0] <= it.x0 <= num_x[1]:
            nums[n] = it
            n += 1
    return items, nums, stop


def analyse(doc, pages: range) -> tuple[list[Q], list[Item], dict]:
    items, nums, stop = locate(doc, pages)
    count = max(nums)
    qs: list[Q] = []
    key = lambda it: (it.page, it.y0)
    groups: dict[int, tuple[int, int, Item]] = {}  # first q -> (first, last, banner)

    for it in items:
        if it.kind == "line":
            m = re.match(r"^Questions (\d+) to (\d+) are based on the following", it.text.strip())
            if m:
                groups[int(m.group(1))] = (int(m.group(1)), int(m.group(2)), it)

    def between(a: Item | None, b: Item | None) -> list[Item]:
        lo = key(a) if a else (0, 0)
        hi = key(b) if b else (10**6, 0)
        return [i for i in items if lo < key(i) < hi]

    prev_ctrl_end: tuple[int, float] | None = None
    prev_clamp: tuple[int, float] | None = None
    for n in range(1, count + 1):
        q = Q(n)
        a = nums[n]
        b = nums.get(n + 1, stop)
        body = [i for i in between(a, b)]
        lines = [i for i in body if i.kind == "line"]

        letters = [l for l in lines
                   if LETTER_X[0] <= l.x0 <= LETTER_X[1]
                   and (re.fullmatch(r"[A-I]", l.text.strip()) or re.match(r"^[A-I]\s+\S", l.text.strip()))
                   and not NOISE_RX.match(l.text.strip())]
        # The reminder box lists A–D at x≈84–90 and is excluded by LETTER_X;
        # require the lettered run to start at A.
        if letters and letters[0].text.strip()[0] != "A":
            letters = []
        q.letters = letters

        has_qab = any(l.text.strip() == "Quantity B" for l in lines)
        ovals = [i for i in body if i.kind == "oval"]
        imgs_small = [i for i in body if i.kind == "image"
                      and ((i.x1 - i.x0 < 170 and i.y1 - i.y0 < 40) or (i.x1 - i.x0 < 100 and i.y1 - i.y0 < 90))]

        # The question's own text on the number line counts too.
        if has_qab:
            q.kind = "QC"
            o = ovals[0] if ovals else None
            last = max((l for l in lines if (o is None or (l.page, l.y1) <= (o.page, o.y0 + 1))), key=key)
            q.stem_end = (o.page, o.y0 + 1.4) if o else (last.page, last.y1 + 2)
            if o:
                # Erase the oval arcs that poke into the crop, but keep any
                # text that sits right on top of the row.
                q.whiten.append((o.page, o.x0 - 3, o.y0 + 0.3, o.x1 + 3, o.y1 + 3))
            q.ctrl_end = (o.page, o.y1) if o else (last.page, last.y1)
        elif letters:
            q.kind = "PS"
            first = letters[0]
            diffs = sorted(b.y0 - a.y0 for a, b in zip(letters, letters[1:]) if a.page == b.page)
            sp = diffs[len(diffs) // 2] if diffs else 21.0
            sp = max(sp, 18.0)
            q.band = (sp, 0.0)  # row pitch; rows are centred on their letter
            first_top = (first.y0 + first.y1) / 2 - (sp / 2 - 1.5)
            above = [i for i in body if i.kind in ("line", "image") and (i.page, i.y0) < (first.page, first.y0 - 3)
                     and not is_noise(i)]
            if above:
                lastb = max(above, key=lambda i: (i.page, i.y1))
                if lastb.page == first.page:
                    q.stem_end = (first.page, min(first_top, lastb.y1 + 5))
                else:
                    q.stem_end = (lastb.page, lastb.y1 + 6)
            else:
                q.stem_end = (first.page, first.y0 - 4)
            last = letters[-1]
            # Wrapped lines and formula rects belong to the last choice.
            tail_y = last.y1
            for i in body:
                if i.page == last.page and i.y0 >= last.y0 - 4 and i.y0 <= tail_y + 8 and i.x0 >= 100 \
                        and i.kind in ("line", "image") and not NOISE_RX.match(i.text.strip()):
                    tail_y = max(tail_y, i.y1)
            q.ctrl_end = (last.page, max(tail_y, (last.y0 + last.y1) / 2 + sp / 2))
            q.clamp_end = (last.page, tail_y)
        else:
            q.kind = "NE"
            last_line = max((l for l in lines if not is_noise(l)), key=key, default=None)
            lt = (last_line.page, last_line.y0 - 3) if last_line else (0, 0)
            box = next((i for i in reversed(imgs_small) if (i.page, i.y1) > lt), None)
            q.box = box
            if box:
                q.whiten.append((box.page, box.x0 - 2, box.y0 - 2, box.x1 + 2, box.y1 + 2))
                q.stem_end = (box.page, box.y1 + 2)
                q.ctrl_end = (box.page, box.y1)
                q.boxes = 2 if (box.y1 - box.y0) > 20 and (box.x1 - box.x0) < 60 else 1
            else:
                last = max((l for l in lines if not is_noise(l)), key=key)
                q.stem_end = (last.page, last.y1 + 2)
                q.ctrl_end = (last.page, last.y1)

        prelude = " ".join(l.text for l in lines if True)
        directive_above = [i for i in items if i.kind == "line" and key(i) < key(a)
                           and key(i) > (prev_ctrl_end or (0, 0))
                           and re.match(r"^For the following question", i.text.strip())]
        multi_text = any("select all" in d.text for d in directive_above) or "Indicate all such" in prelude
        q.multi = bool(letters) and multi_text
        if q.kind == "NE" and any("boxes" in d.text for d in directive_above):
            q.boxes = 2

        # Material above the number: a figure, table or caption that sits
        # between the previous question's controls and this number.
        q.top = (a.page, a.y0 - 16)
        is_group_first = n in groups
        if prev_ctrl_end is not None and not is_group_first:
            gap = [i for i in items if i.kind in ("line", "image") and prev_ctrl_end < key(i) < key(a)
                   and not is_noise(i)]
            if gap:
                g = min(gap, key=key)
                q.top = (g.page, g.y0 - 4)
        # A divider rule printed just above the number is not part of the question.
        for rule in items:
            if rule.kind == "rule" and rule.page == a.page and a.y0 - 22 < rule.y1 < a.y0 and rule.y1 + 2 > q.top[1] \
                    and q.top[0] == a.page:
                q.top = (a.page, rule.y1 + 2)
        if prev_clamp is not None and prev_clamp[0] == q.top[0]:
            # Never reach back into the previous question's controls.
            q.top = (q.top[0], max(q.top[1], prev_clamp[1] + 3))
        # A shared exhibit belongs to the group, not to its first question.
        for first, (f, l, banner) in groups.items():
            if n == f:
                q.exhibit = (f, l)
        qs.append(q)
        prev_ctrl_end = q.ctrl_end
        prev_clamp = q.clamp_end if q.clamp_end != (0, 0) else q.ctrl_end

    return qs, items, {"nums": nums, "stop": stop, "groups": groups}


# ── Cropping ──────────────────────────────────────────────────────────────

class Renderer:
    def __init__(self, doc):
        self.doc = doc
        self._cache: dict[int, Image.Image] = {}

    def page(self, p: int) -> Image.Image:
        if p not in self._cache:
            pix = self.doc[p - 1].get_pixmap(dpi=DPI)
            self._cache[p] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        return self._cache[p]

    def strip(self, a: tuple[int, float], b: tuple[int, float], whiten: list = (),
              x0: float = X0, x1: float = X1) -> Image.Image | None:
        """Crop from (page, y) down to (page, y), stitching across pages."""
        parts = []
        for p in range(a[0], b[0] + 1):
            im = self.page(p).copy()
            d = ImageDraw.Draw(im)
            for (wp, wx0, wy0, wx1, wy1) in whiten:
                if wp == p:
                    d.rectangle([wx0 * S, wy0 * S, wx1 * S, wy1 * S], fill="white")
            ya = a[1] if p == a[0] else 56
            yb = b[1] if p == b[0] else 740
            if yb - ya < 2:
                continue
            piece = trim_v(im.crop((int(x0 * S), int(max(0, ya) * S), int(x1 * S), int(min(im.height / S, yb) * S))), pad=4)
            if piece is not None:
                parts.append(piece)
        if not parts:
            return None
        w = parts[0].width
        out = Image.new("RGB", (w, sum(p.height for p in parts)), "white")
        y = 0
        for p in parts:
            out.paste(p, (0, y))
            y += p.height
        return trim_v(out)


def trim_right(im: Image.Image, pad: int = 10, thresh: int = 245) -> Image.Image:
    """Drop the blank right-hand margin of a choice crop."""
    g = im.convert("L").point(lambda v: 255 if v < thresh else 0)
    bb = g.getbbox()
    return im.crop((0, 0, min(im.width, bb[2] + pad), im.height)) if bb else im


def trim_v(im: Image.Image, pad: int = 8, thresh: int = 245) -> Image.Image | None:
    g = im.convert("L").point(lambda v: 255 if v < thresh else 0)
    bb = g.getbbox()
    if not bb:
        return None
    return im.crop((0, max(0, bb[1] - pad), im.width, min(im.height, bb[3] + pad)))


# ── Rendering a section to files ──────────────────────────────────────────

OUT_SCALE = 0.72           # 200 dpi render → 144 dpi files (2 px per point)


def finish(im: Image.Image) -> Image.Image:
    return im.resize((max(1, round(im.width * OUT_SCALE)), max(1, round(im.height * OUT_SCALE))), Image.LANCZOS)


def save(im: Image.Image, path, quality: int = 82) -> dict:
    from pathlib import Path
    im = finish(im)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    return {"w": im.width, "h": im.height}


def render_figures(doc, pages: range, out_dir, url_prefix: str) -> list[dict]:
    """Per question: its type/format and the pictures it carries.

    The words of a question are typed (quant_text.py); only what is truly a
    picture — a geometric figure, a graph — is cropped from the page, tight
    around the image itself. A figure shared by questions 17–20 is attached
    once, to the group.
    """
    qs, items, info = analyse(doc, pages)
    rend = Renderer(doc)
    key = lambda it: (it.page, it.y0)

    def crop(img: Item, path: str) -> dict:
        im = rend.strip((img.page, img.y0 - 3), (img.page, img.y1 + 3), x0=img.x0 - 3, x1=img.x1 + 3)
        return {"src": f"{url_prefix}/{path}", **save(im, out_dir / path)}

    result = []
    for q in qs:
        entry: dict = {"n": q.n, "boxes": q.boxes}
        if q.kind == "QC":
            entry.update(type="QC", format="single")
        elif q.kind == "NE":
            entry.update(type="NE", format="fraction" if q.boxes == 2 else "numeric")
        else:
            entry.update(type="PS", format="multi" if q.multi else "single")
        # A group's exhibit is not the first question's own figure.
        start = (info["nums"][q.n].page, info["nums"][q.n].y0 - 2) if q.exhibit else q.top
        figs = [i for i in items if i.kind == "image" and i is not q.box and i.x1 - i.x0 >= 30
                and start <= key(i) and (i.page, i.y1) <= (q.stem_end[0], q.stem_end[1] + 3)]
        if figs:
            entry["figure"] = crop(figs[0], f"q{q.n}-fig.webp")
        if q.exhibit:
            _, _, banner = info["groups"][q.n]
            ex = [i for i in items if i.kind == "image" and key(banner) < key(i) < key(info["nums"][q.n])]
            entry["exhibitFirst"], entry["exhibitLast"] = q.exhibit
            if ex:
                entry["exhibit"] = crop(ex[0], f"exhibit-{q.n}.webp")
        result.append(entry)
    return result


# ── Explanations (images) ────────────────────────────────────────────────

def render_explanations(doc, pages: range, exam_qs: list[Q], exam_nums: dict, out_dir, url_prefix: str) -> dict[int, dict]:
    """Crop each question's explanation from the 'Answers and Explanations'
    pages. The repeated question above it is skipped (the app already shows
    it); a figure belonging to the NEXT question is cut off using the height
    it had on the exam page, because the layout repeats verbatim."""
    items, nums, _ = locate(doc, pages, num_x=(62, 92))
    last_page = pages[-1]
    key = lambda it: (it.page, it.y0)
    rend = Renderer(doc)
    banners = {}
    for it in items:
        if it.kind == "line":
            m = re.match(r"^Questions (\d+) to (\d+) are based on the following", it.text.strip())
            if m:
                banners[int(m.group(1))] = it
    # How much figure/table sits above each question on the exam page.
    above = {}
    for q in exam_qs:
        num = exam_nums[q.n]
        if q.top[0] == num.page and q.top[1] < num.y0 - 16 - 1:
            above[q.n] = (num.y0 - 16) - q.top[1]
    out: dict[int, dict] = {}
    for n in sorted(nums):
        label = next((i for i in items if i.kind == "line" and i.text.strip() == "Explanation"
                      and key(nums[n]) < key(i) and (n + 1 not in nums or key(i) < key(nums[n + 1]))), None)
        if label is None:
            continue
        start = (label.page, label.y1 + 3)
        if n + 1 in nums:
            nxt = nums[n + 1]
            if n + 1 in banners:
                end = (banners[n + 1].page, banners[n + 1].y0 - 6)
            else:
                h = above.get(n + 1, 0)
                end = (nxt.page, nxt.y0 - 16 - (h + 10 if h else 0))
            # "For the following question, ..." introduces the next question.
            for d in items:
                if d.kind == "line" and re.match(r"^For the following question", d.text.strip()) \
                        and start < key(d) < (nxt.page, nxt.y0) and key(d) < end:
                    end = (d.page, d.y0 - 4)
        else:
            end = (last_page, 735.0)
        # Explanations close with "Strategy k: ..." lines (one may wrap);
        # when present they are the surest end marker.
        inside = [i for i in items if i.kind == "line" and start < key(i) < end]
        strat = [i for i in inside if i.text.strip().startswith("Strategy ")]
        if strat:
            last = max(strat, key=key)
            stop_y = last.y1
            for i in sorted(inside, key=key):
                if key(i) > key(last) and i.page == last.page and i.y0 - stop_y < 9 \
                        and not is_noise(i) and not i.text.strip().startswith("Strategy "):
                    stop_y = i.y1
            end = min(end, (last.page, stop_y + 5))
        im = rend.strip(start, end)
        if im is not None:
            out[n] = {"src": f"{url_prefix}/e{n}.webp", **save(im, out_dir / f"e{n}.webp", quality=80)}
    return out
