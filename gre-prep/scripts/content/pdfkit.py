"""Small helpers for cutting regions out of a PDF as images.

The two source PDFs draw their math (fractions, roots, exponents) and their
figures as vector graphics or embedded rasters, so `pdftotext` silently drops
them. Rather than transcribing formulas by hand, the content scripts locate
text anchors (headings, question numbers) with `pdftotext -bbox-layout` and
crop the rendered page between those anchors.

Requires poppler (`pdftotext`, `pdftoppm`) and Pillow with WebP support.
"""

from __future__ import annotations

import html
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

PAGE_W, PAGE_H = 612.0, 792.0


@dataclass
class Line:
    x0: float
    y0: float
    x1: float
    y1: float
    text: str


class Pdf:
    def __init__(self, path: str | Path, dpi: int = 150):
        self.path = str(path)
        self.dpi = dpi
        self._cache = Path(tempfile.mkdtemp(prefix="pdfkit-"))
        self._pages: dict[int, list[Line]] | None = None

    # ── Text anchors ────────────────────────────────────────────────────
    def lines(self, page: int) -> list[Line]:
        if self._pages is None:
            self._pages = self._load_bbox()
        return self._pages.get(page, [])

    def _load_bbox(self) -> dict[int, list[Line]]:
        out = subprocess.run(
            ["pdftotext", "-bbox-layout", self.path, "-"],
            check=True, capture_output=True, text=True,
        ).stdout
        pages: dict[int, list[Line]] = {}
        for n, chunk in enumerate(out.split("<page ")[1:], start=1):
            ls: list[Line] = []
            for m in re.finditer(
                r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>',
                chunk, re.S,
            ):
                words = re.findall(r"<word[^>]*>(.*?)</word>", m.group(5), re.S)
                ls.append(Line(*(float(m.group(i)) for i in range(1, 5)),
                               html.unescape(" ".join(words))))
            ls.sort(key=lambda l: (l.y0, l.x0))
            pages[n] = ls
        return pages

    def find(self, pattern: str, pages: range | list[int], max_x: float | None = None,
             flags: int = 0) -> list[tuple[int, Line]]:
        rx = re.compile(pattern, flags)
        hits = []
        for p in pages:
            for l in self.lines(p):
                if max_x is not None and l.x0 > max_x:
                    continue
                if rx.search(l.text):
                    hits.append((p, l))
        return hits

    # ── Rendering ───────────────────────────────────────────────────────
    def render(self, page: int) -> Image.Image:
        f = self._cache / f"p{page}.png"
        if not f.exists():
            subprocess.run(
                ["pdftoppm", "-r", str(self.dpi), "-f", str(page), "-l", str(page),
                 "-png", "-singlefile", self.path, str(f.with_suffix(""))],
                check=True,
            )
        return Image.open(f).convert("RGB")

    def crop(self, page: int, y0: float, y1: float,
             x0: float = 0, x1: float = PAGE_W) -> Image.Image:
        im = self.render(page)
        s = self.dpi / 72.0
        box = (int(x0 * s), max(0, int(y0 * s)), int(x1 * s), min(im.height, int(y1 * s)))
        return im.crop(box)


def trim(im: Image.Image, pad: int = 6, thresh: int = 245,
         vertical_only: bool = False) -> Image.Image | None:
    """Crop away blank margins; None when the image is entirely blank.

    With `vertical_only` the width is kept, so stacked chunks of one document
    stay aligned and render at the same scale.
    """
    g = im.convert("L").point(lambda v: 255 if v < thresh else 0)
    bb = g.getbbox()
    if not bb:
        return None
    x0, y0, x1, y1 = bb
    if vertical_only:
        x0, x1 = 0, im.width
    return im.crop((max(0, x0 - pad), max(0, y0 - pad),
                    min(im.width, x1 + pad), min(im.height, y1 + pad)))


def stack(parts: list[Image.Image], gap: int = 0, bg=(255, 255, 255)) -> Image.Image:
    w = max(p.width for p in parts)
    h = sum(p.height for p in parts) + gap * (len(parts) - 1)
    out = Image.new("RGB", (w, h), bg)
    y = 0
    for p in parts:
        out.paste(p, (0, y))
        y += p.height + gap
    return out


def save_webp(im: Image.Image, path: str | Path, max_w: int | None = None,
              quality: int = 78) -> tuple[int, int]:
    if max_w and im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size


def region(pdf: Pdf, start: tuple[int, float], end: tuple[int, float],
           x0: float, x1: float, top: float = 60, bottom: float = 735) -> list[Image.Image]:
    """Crop from (page, y) to (page, y), one image per page, margins trimmed.

    `end` is exclusive. A chunk that turns out blank is skipped, so a heading
    sitting at the very top of a page does not leave an empty strip behind.
    """
    (p0, y0), (p1, y1) = start, end
    chunks = []
    for p in range(p0, p1 + 1):
        a = y0 if p == p0 else top
        b = y1 if p == p1 else bottom
        if b - a < 4:
            continue
        im = trim(pdf.crop(p, a, b, x0, x1), vertical_only=True)
        if im is not None:
            chunks.append(im)
    return chunks
