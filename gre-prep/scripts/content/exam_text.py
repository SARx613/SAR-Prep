"""Text-side extraction for the practice tests: verbal items, essay prompts,
explanations and the sample essays.

Everything here reads the Official Guide PDF through PyMuPDF so that each line
keeps its coordinates and font — those carry what plain text drops:

  * the blanks of Text Completion / Sentence Equivalence are drawn as hairline
    images, not characters, so they show up as `{{n}}` placeholders;
  * boldface and italics inside passages are meaningful (one question asks
    about "the two portions in boldface"), so they are kept as ** and *.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import pymupdf as fitz


@dataclass
class El:
    kind: str  # line | blank | margin
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str = ""   # with ** / * markup
    plain: str = ""


def _span_text(spans) -> tuple[str, str]:
    """(marked, plain) text for one line, merging runs of equal style."""
    runs: list[tuple[str, str]] = []
    for s in spans:
        t = s["text"]
        if not t:
            continue
        font = s["font"].lower()
        style = "b" if ("bold" in font or s["flags"] & 16) else "i" if ("italic" in font or s["flags"] & 2) else ""
        if runs and runs[-1][1] == style:
            runs[-1] = (runs[-1][0] + t, style)
        else:
            runs.append((t, style))
    marked = ""
    for t, style in runs:
        if style and t.strip():
            lead = t[: len(t) - len(t.lstrip())]
            trail = t[len(t.rstrip()):]
            mark = "**" if style == "b" else "*"
            marked += f"{lead}{mark}{t.strip()}{mark}{trail}"
        else:
            marked += t
    return marked, "".join(t for t, _ in runs)


def _reading_order(els: list[El], tol: float = 5.0) -> list[El]:
    """Top-to-bottom, left-to-right, treating near-equal baselines as one row
    (a choice letter and its text sit a couple of points apart)."""
    els = sorted(els, key=lambda e: e.y0)
    rows: list[list[El]] = []
    for e in els:
        if rows and e.y0 - rows[-1][0].y0 < tol:
            rows[-1].append(e)
        else:
            rows.append([e])
    return [e for r in rows for e in sorted(r, key=lambda e: e.x0)]


def elements(doc, pages: range, markup: bool = True) -> list[El]:
    out: list[El] = []
    for p in pages:
        pg = doc[p - 1]
        els: list[El] = []
        for b in pg.get_text("dict")["blocks"]:
            x0, y0, x1, y1 = b["bbox"]
            if b["type"] == 1:
                # Blank markers: hairline-thin, but wide enough to be a rule.
                # The rule sits on the baseline, so order it with its own row.
                if (y1 - y0) <= 2.5 and (x1 - x0) >= 25:
                    els.append(El("blank", p, x0, y0 - 11, x1, y1))
                continue
            for l in b["lines"]:
                marked, plain = _span_text(l["spans"])
                if not plain.strip():
                    continue
                lx0, ly0, lx1, ly1 = l["bbox"]
                kind = "line"
                if re.fullmatch(r"(line\s+)?\d{1,3}", plain.strip()) and lx1 <= 112:
                    kind = "margin"
                els.append(El(kind, p, lx0, ly0, lx1, ly1,
                              marked if markup else plain, plain.strip() if kind == "margin" else plain))
        out.extend(_reading_order(els))
    return out


def section_elements(doc, pages: range, number: int) -> list[El]:
    """Elements of one section; a page can hold the end of one section and
    the start of the next, so cut at its own header."""
    els = elements(doc, pages)
    start = next((i for i, e in enumerate(els)
                  if e.kind == "line" and re.fullmatch(rf"SECTION {number}", e.plain.strip())), 0)
    els = els[start:]
    stop = next((i for i, e in enumerate(els)
                 if e.kind == "line" and re.fullmatch(rf"SECTION {number + 1}", e.plain.strip())), len(els))
    return els[:stop]


# ── Reflowing lines into paragraphs ───────────────────────────────────────

def reflow(lines: list[El], indent_gap: float = 8.0) -> list[str]:
    """Join wrapped lines; a line indented past the block's left edge starts
    a new paragraph. Margin line numbers become ⟦n⟧ markers and a hairline
    blank becomes a run of underscores."""
    body = [l for l in lines if l.kind in ("line", "blank")]
    if not body:
        return []
    margins = [m for m in lines if m.kind == "margin"]

    # PyMuPDF sometimes breaks one justified line into several pieces that
    # share a baseline; fold those back into a single row first.
    rows: list[El] = []
    for l in body:
        piece = El("line", l.page, l.x0, l.y0, l.x1, l.y1,
                   "_______" if l.kind == "blank" else l.text.strip(), l.plain)
        if rows and rows[-1].page == l.page and abs(rows[-1].y0 - l.y0) < 3.5:
            rows[-1].text += " " + piece.text
            rows[-1].x1 = max(rows[-1].x1, l.x1)
        else:
            rows.append(piece)
    real = [r for r in rows if r.text != "_______"] or rows
    left = min(r.x0 for r in real)
    paras: list[list[str]] = []
    for r in rows:
        tag = ""
        for m in margins:
            if abs(m.y0 - r.y0) < 7 and m.page == r.page:
                tag = f"⟦{re.sub(r'[^0-9]', '', m.plain)}⟧"
        text = tag + r.text
        if not paras or r.x0 > left + indent_gap:
            paras.append([text])
        else:
            paras[-1].append(text)
    joined = []
    for p in paras:
        s = re.sub(r"\s+", " ", " ".join(p)).strip()
        # Italic runs broken by a line wrap: *a* *b* -> *a b*
        s = re.sub(r"\*(?=\S)([^*]+)\*\s+\*(?=\S)", r"*\1 ", s)
        s = re.sub(r"\s+([.,;:?!])", r"\1", s)
        joined.append(s)
    return joined


# ── Verbal sections ───────────────────────────────────────────────────────

NUM_RX = r"^\s*{n}\.\s*(.*)$"
PASSAGE_RX = re.compile(r"^Questions?\s+(\d+)(?:\s+(?:to|and)\s+(\d+))?\s+(?:is|are)\s+based on the following", re.I)
DIRECTIVE_RX = re.compile(r"^(For the following question|For each of Questions|For Questions|For Question)", re.I)


def _is_directive(e: El) -> bool:
    return e.kind == "line" and bool(DIRECTIVE_RX.match(e.plain.strip()))


def _directive_text(els: list[El], i: int) -> tuple[str, int]:
    """A directive may wrap onto the next line; return (text, last index)."""
    text = els[i].plain.strip()
    j = i
    while not re.search(r"[.:]$", text) and j + 1 < len(els) and els[j + 1].kind == "line" \
            and els[j + 1].y0 - els[j].y1 < 6 and not _is_directive(els[j + 1]):
        j += 1
        text += " " + els[j].plain.strip()
    return text, j


def parse_verbal(els: list[El], n_questions: int = 25) -> dict:
    """→ {"passages": [...], "items": [...]} (no answers)."""
    passages: list[dict] = []
    items: list[dict] = []
    mode = "RC"  # RC | TC | SE
    one_shot_multi = False
    expect = 1
    i = 0
    # Skip the section header, up to the first directive/passage.
    while i < len(els) and not (_is_directive(els[i]) or PASSAGE_RX.match(els[i].plain.strip())):
        i += 1

    cur_passage: dict | None = None

    def number_line(idx: int, n: int) -> bool:
        e = els[idx]
        return e.kind == "line" and e.x0 < 85 and re.match(NUM_RX.format(n=n), e.plain) is not None

    while i < len(els) and expect <= n_questions:
        e = els[i]
        if e.kind != "line":
            i += 1
            continue
        t = e.plain.strip()

        if t.startswith("STOP."):
            break

        m = PASSAGE_RX.match(t)
        if m:
            first, last = int(m.group(1)), int(m.group(2) or m.group(1))
            i += 1
            body: list[El] = []
            while i < len(els) and not (number_line(i, expect) or _is_directive(els[i])
                                        or els[i].plain.strip().startswith("STOP.")):
                body.append(els[i])
                i += 1
            cur_passage = {"id": f"p{len(passages) + 1}", "first": first, "last": last,
                           "paragraphs": reflow(body)}
            passages.append(cur_passage)
            continue

        if _is_directive(e):
            text, i = _directive_text(els, i)
            i += 1
            low = text.lower()
            if "select one entry for each blank" in low:
                mode = "TC"
            elif "select the two answer choices" in low:
                mode = "SE"
            elif "consider each of the choices separately" in low or "select all that apply" in low:
                one_shot_multi = True
            elif "select one answer choice" in low:
                mode = "RC"
            continue

        if number_line(i, expect):
            n = expect
            start = i
            i += 1
            while i < len(els):
                x = els[i]
                if x.plain.strip().startswith("STOP."):
                    break
                if x.kind == "line" and (PASSAGE_RX.match(x.plain.strip()) or _is_directive(x)
                                         or number_line(i, n + 1)):
                    break
                i += 1
            block = els[start:i]
            passage_id = None
            if cur_passage and cur_passage["first"] <= n <= cur_passage["last"]:
                passage_id = cur_passage["id"]
            item_mode = "RC" if passage_id else mode
            items.append(_parse_item(n, block, item_mode, passage_id, one_shot_multi))
            one_shot_multi = False
            expect += 1
            continue

        i += 1

    for p in passages:
        p.pop("first"), p.pop("last")
    return {"passages": passages, "items": items}


CHOICE_RX = re.compile(r"^([A-I])(?:\s+(.*))?$")


def _parse_item(n: int, block: list[El], mode: str, passage_id: str | None,
                multi: bool) -> dict:
    first = block[0]
    first_text = re.sub(NUM_RX.format(n=n).replace("(.*)$", "(.*)$"), r"\1", first.text, count=1)
    first_text = re.sub(r"^\s*%d\.\s*" % n, "", first.text)

    stem_parts: list[El | str] = []   # lines and blanks in reading order
    choices: list[dict] = []
    blank_choice_groups: list[list[dict]] = []
    cur_choice: dict | None = None
    in_choices = False
    group: list[dict] = []

    rest = block[1:]
    # The number line itself carries stem text.
    seq: list[El] = [El("line", first.page, first.x0, first.y0, first.x1, first.y1,
                        first_text, re.sub(r"^\s*%d\.\s*" % n, "", first.plain))] + rest

    for e in seq:
        if e.kind == "margin":
            continue
        if e.kind == "blank":
            if not in_choices:
                stem_parts.append(e)
            continue
        t = e.plain.strip()
        lab = re.match(r"^Blank \(([iv]+)\)$", t)
        if lab:
            if group:
                blank_choice_groups.append(group)
            group, cur_choice, in_choices = [], None, True
            continue
        in_gutter = 90 <= e.x0 <= 112
        if in_gutter and re.fullmatch(r"[A-I]", t):
            cur_choice = {"id": t, "text": ""}
            (group if mode == "TC" else choices).append(cur_choice)
            in_choices = True
            continue
        m = re.match(r"^([A-I])\s+\S", t)
        if m and 90 <= e.x0 <= 100 and in_choices is False and False:
            pass
        if m and 90 <= e.x0 <= 100:
            cur_choice = {"id": m.group(1), "text": e.text.strip()[1:].strip()}
            (group if mode == "TC" else choices).append(cur_choice)
            in_choices = True
            continue
        if in_choices and cur_choice is not None and e.x0 > 100:
            cur_choice["text"] = (cur_choice["text"] + " " + e.text.strip()).strip()
            continue
        if not in_choices:
            stem_parts.append(e)
    if group:
        blank_choice_groups.append(group)

    item: dict = {"n": n}
    if passage_id:
        item["passageId"] = passage_id

    # Assemble the stem, turning hairline images into {{k}}.
    k = 0
    pieces = []
    for p in stem_parts:
        if isinstance(p, El) and p.kind == "blank":
            k += 1
            pieces.append(f"{{{{{k}}}}}")
        else:
            pieces.append(p.text.strip())
    stem = re.sub(r"\s+", " ", " ".join(pieces)).strip()
    stem = re.sub(r"\((?:i{1,3}|iv)\)\s*(?=\{\{\d\}\})", "", stem)
    stem = re.sub(r"\s+([,.;:?])", r"\1", stem)

    if mode == "TC" and not passage_id:
        item["type"] = "TC"
        item["text"] = stem
        if not blank_choice_groups and choices:
            blank_choice_groups = [choices]
        item["blanks"] = [{"index": i + 1, "choices": g} for i, g in enumerate(blank_choice_groups)]
    elif mode == "SE" and not passage_id:
        item["type"] = "SE"
        item["text"] = stem
        item["choices"] = choices
    else:
        item["type"] = "RC"
        item["stem"] = stem
        if not choices:
            item["format"] = "sentence"
        else:
            item["format"] = "multi" if multi else "single"
            item["choices"] = choices
    return item


# ── Explanations (verbal: text; quant handled by image crops) ─────────────

def verbal_explanations(els: list[El], n_questions: int = 25) -> dict[int, list[str]]:
    """{n: paragraphs} from the 'Answers and Explanations' pages."""
    def number_line(idx: int, n: int) -> bool:
        e = els[idx]
        return e.kind == "line" and e.x0 < 85 and re.match(NUM_RX.format(n=n), e.plain) is not None

    out: dict[int, list[str]] = {}
    n = 1
    i = 0
    while i < len(els) and n <= n_questions:
        if not number_line(i, n):
            i += 1
            continue
        i += 1
        # Find this question's "Explanation" label before the next question.
        while i < len(els) and not (els[i].kind == "line" and els[i].plain.strip() == "Explanation"):
            if number_line(i, n + 1) and n < n_questions:
                break
            i += 1
        if i >= len(els) or els[i].plain.strip() != "Explanation":
            n += 1
            continue
        i += 1
        body: list[El] = []
        while i < len(els):
            x = els[i]
            if x.kind == "line" and (number_line(i, n + 1) and n < n_questions
                                     or PASSAGE_RX.match(x.plain.strip()) or _is_directive(x)
                                     or x.plain.strip().startswith("STOP.")):
                break
            body.append(x)
            i += 1
        out[n] = reflow(body, indent_gap=3.0)
        n += 1
    return out
