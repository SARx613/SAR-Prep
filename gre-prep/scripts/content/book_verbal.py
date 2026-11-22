"""Verbal items from the "Answers and Explanations" pages of the ETS practice books.

Used for *Official GRE Verbal Reasoning Practice Questions* (2nd ed.) and for the
practice-question chapter of the *Official Guide* (3rd ed.). Both books reprint
every question, with its passage and choices, right above its explanation, so
one pass over those pages yields the question and its explanation together.
The answer key is parsed separately and every keyed choice is checked against
the parsed choice text, which catches any mis-split.

Line conventions relied on (checked against the pages):
  * a question starts with an "N." token in the left gutter, its stem to the right;
  * choices start with a lone capital letter (A–I) then a tab;
  * multi-blank Text Completion lays out its choices in columns, letters
    continuing across blanks (A–C, D–F, G–I);
  * "**Explanation**" opens the explanation, which runs to the next question,
    passage or set header;
  * the accessible PDF writes a blank as the word "blank" between wide spaces,
    preceded by "(i)", "(ii)", "(iii)" when there are several.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import pymupdf as fitz

SOFT = "­"


@dataclass
class Line:
    page: int
    x: float
    y: float
    x1: float
    size: float
    text: str   # with **bold** / *italic* markup
    plain: str


def _marked(spans) -> tuple[str, str]:
    out, plain = "", ""
    for s in spans:
        t = s["text"]
        plain += t
        if not t.strip():
            out += t
            continue
        f = s["font"].lower()
        bold = "bold" in f or s["flags"] & 16
        ital = "italic" in f or "oblique" in f or s["flags"] & 2
        lead, core, trail = t[: len(t) - len(t.lstrip())], t.strip(), t[len(t.rstrip()):]
        if bold:
            out += f"{lead}**{core}**{trail}"
        elif ital:
            out += f"{lead}*{core}*{trail}"
        else:
            out += t
    return out, plain


NOISE = re.compile(r"^(Information wants to be free|Question Type \d.*|Mixed Practice Sets|"
                   r"GRE® Verbal Reasoning Practice Questions|\d{1,3})$")


def _segments(block_lines):
    """Split each PDF line where a wide horizontal gap separates two columns
    (side-by-side choice columns are sometimes stored as one line)."""
    for l in block_lines:
        spans = [s for s in l["spans"] if s["text"]]
        seg: list = []
        for s in spans:
            if seg and s["text"].strip() and seg[-1]["text"].strip() is not None:
                last = max(x["bbox"][2] for x in seg if x["text"].strip()) if any(x["text"].strip() for x in seg) else None
                if last is not None and s["bbox"][0] - last > 40:
                    yield seg
                    seg = []
            seg.append(s)
        if seg:
            yield seg


def lines(doc, pages: range) -> list[Line]:
    """Content lines of 1-based `pages`, in reading order, headers/footers dropped."""
    out: list[Line] = []
    for p in pages:
        pg = doc[p - 1]
        h = pg.rect.height
        page_lines: list[Line] = []
        for b in pg.get_text("dict")["blocks"]:
            if b["type"] != 0:
                continue
            for seg in _segments(b["lines"]):
                l = {"spans": seg, "bbox": (min(s["bbox"][0] for s in seg), min(s["bbox"][1] for s in seg),
                                            max(s["bbox"][2] for s in seg), max(s["bbox"][3] for s in seg))}
                text, plain = _marked(l["spans"])
                if not plain.strip():
                    continue
                x0, y0, x1, y1 = l["bbox"]
                if y0 < 45 or y0 > h - 50:
                    continue
                if NOISE.match(plain.strip()) and not re.fullmatch(r"\d{1,2}", plain.strip()):
                    continue
                size = max(s["size"] for s in l["spans"] if s["text"].strip())
                page_lines.append(Line(p, x0, y0, x1, size, text.rstrip(), plain.strip()))
        page_lines.sort(key=lambda l: (round(l.y / 4), l.x))
        out.extend(page_lines)
    return out


# ── text helpers ──────────────────────────────────────────────────────────

def join(parts: list[str]) -> str:
    """Join wrapped lines, healing soft hyphens and markup split across lines."""
    s = ""
    for t in parts:
        t = t.strip()
        if not t:
            continue
        if s.endswith(SOFT):
            s = s[:-1] + t
        elif s.endswith(SOFT + "**") or s.endswith(SOFT + "*"):
            s = re.sub(SOFT + r"(\*+)$", "", s) + t.lstrip("*")
        elif s.endswith("-") and not s.endswith(" -") and not s.endswith("—"):
            s = s + t
        else:
            s = (s + " " + t) if s else t
    s = s.replace(SOFT, "")
    s = re.sub(r"\*\*\s*\*\*", " ", s)            # **a** **b** → **a b**
    s = re.sub(r"(?<!\*)\*(?!\*)\s+(?<!\*)\*(?!\*)", " ", s)
    s = re.sub(r"\*\*(\s*)\*\*", r"\1", s)
    s = s.replace("\t", " ")
    return re.sub(r"\s+", " ", s).strip()


def strip_marks(s: str) -> str:
    return re.sub(r"\*+", "", s)


ROMAN = {"i": 1, "ii": 2, "iii": 3}


def blanks_to_markers(s: str) -> tuple[str, int]:
    s = strip_marks(s)
    n = 0

    def numbered(m):
        return "{{%d}}" % ROMAN[m.group(1)]

    s2, k = re.subn(r"\((i{1,3})\)?\s*(?:_{3,}|\bblank\b)", numbered, s)
    if k:
        n = k
    else:
        s2, n = re.subn(r"\s*(?:_{3,}|\bblank\b)\s*", " {{1}} ", s, count=1)
    s2 = re.sub(r"\}\}(?=[A-Za-z])", "}} ", s2)
    s2 = re.sub(r"\s+", " ", s2).strip()
    s2 = re.sub(r"\s+([,.;:?!’”)])", r"\1", s2)
    return s2, n


# ── item parser ───────────────────────────────────────────────────────────

QNUM = re.compile(r"^(\d{1,2})\.\s*(.*)$")
CHOICE = re.compile(r"^([A-I])\s*[\t ]\s*(.*)$")
SET_HDR = re.compile(r"^(?:PRACTICE\s+SET|SET)\s+(\d)\b", re.I)
BASED = re.compile(r"^Questions? (\d+)(?: (?:and|to|through) (\d+))? (?:is|are) based on (?:this|the following) passage", re.I)


def _directive(plain: str) -> str | None:
    p = plain.lower()
    if "select one entry for each blank" in p:
        return "TC"
    if "select the two answer choices" in p:
        return "SE"
    if "select one answer choice unless otherwise directed" in p or "select only one answer choice" in p:
        return "RC"
    if "consider each of the choices separately and select all that apply" in p:
        return "ALL"
    return None


def parse_sets(doc, pages: range) -> dict[int, dict]:
    """{set number: {"passages": [...], "items": [...]}} from explanation pages.

    Items: {n, type, text|stem, choices|blanks, passageId?, format?, explanation:[paras]}
    Passages: {id, paragraphs (with ⟦n⟧ line markers), description}
    """
    ls = lines(doc, pages)
    sets: dict[int, dict] = {}
    cur_set = None
    mode = "RC"           # current directive type
    select_all_next = False
    state = None          # passage | description | stem | choices | expl
    passage = None
    item = None
    buf: list[Line] = []
    margin: list[Line] = []
    pending_passage_for: tuple[int, int] | None = None

    def ensure_set(n: int):
        nonlocal cur_set
        cur_set = sets.setdefault(n, {"passages": [], "items": []})

    def flush_passage():
        nonlocal buf
        if passage is not None and buf:
            passage["paragraphs"] = _paragraphs(buf, margin)
            margin.clear()
        buf = []

    def flush_desc():
        nonlocal buf
        if passage is not None:
            passage["description"] = join([l.text for l in buf])
        buf = []

    def flush_item():
        nonlocal item, buf
        if item is None:
            return
        if state == "expl":
            item["explanation"] = _expl_paragraphs(buf)
        _finish_item(item)
        cur_set["items"].append(item)
        item = None
        buf = []

    i = 0
    while i < len(ls):
        l = ls[i]
        plain = l.plain
        bold = l.text.startswith("**")

        m = SET_HDR.match(strip_marks(plain))
        if m and bold:
            if state == "passage":
                flush_passage()
            flush_item()
            ensure_set(int(m.group(1)))
            state = None
            passage = None
            i += 1
            continue
        if cur_set is None:
            i += 1
            continue

        d = _directive(plain) if bold or plain.startswith("For ") else None
        if d is None and bold and i + 1 < len(ls):
            d = _directive(plain + " " + ls[i + 1].plain)
        if d:
            if state == "passage":
                flush_passage()
            flush_item()
            if d == "ALL":
                select_all_next = True
            else:
                mode = d
            state = None
            # swallow a wrapped second line of the directive
            while i + 1 < len(ls) and ls[i + 1].text.startswith("**") and not QNUM.match(ls[i + 1].plain) \
                    and not BASED.match(strip_marks(ls[i + 1].plain)):
                i += 1
            i += 1
            continue

        m = BASED.match(strip_marks(plain))
        if m and bold:
            if state == "passage":
                flush_passage()
            flush_item()
            pid = f"p{len(cur_set['passages']) + 1}"
            passage = {"id": pid, "paragraphs": [], "description": ""}
            cur_set["passages"].append(passage)
            state = "passage"
            mode = "RC"
            i += 1
            continue

        if plain in ("Description",) and bold:
            if state == "passage":
                flush_passage()
            state = "description"
            buf = []
            i += 1
            continue

        if state == "passage":
            if re.fullmatch(r"\*?(Line|\d{1,2})\*?", plain) and l.x < 135:
                margin.append(l)
                i += 1
                continue
            mq = QNUM.match(plain)
            if not (mq and l.x < 150):
                buf.append(l)
                i += 1
                continue
            flush_passage()

        mq = QNUM.match(plain)
        if mq and l.x < 150 and (state != "expl" or _looks_like_question(ls, i)):
            if state == "description":
                flush_desc()
            flush_item()
            n = int(mq.group(1))
            item = {"n": n, "type": mode, "_stem": [], "_choices": [], "_cols": [],
                    "_multi": select_all_next, "_stem_x": None, "_num_x": l.x}
            if mode == "RC" and passage is not None:
                item["passageId"] = passage["id"]
            select_all_next = False
            rest = mq.group(2).strip()
            if rest:
                item["_stem"].append(l.text[l.text.find(rest):] if rest in l.text else rest)
            state = "stem"
            i += 1
            continue

        if state == "description":
            buf.append(l)
            i += 1
            continue

        if state in ("stem", "choices") and item is not None:
            if plain == "Explanation" and bold:
                state = "expl"
                buf = []
                i += 1
                continue
            if re.fullmatch(r"Blank \((i{1,3})\)", plain):
                i += 1
                continue
            mc = CHOICE.match(l.text.strip())
            seen = {c[0] for c in item["_choices"]}
            tabbed = re.match(r"^[A-I][ \u00a0]*\t", plain)
            sx = item["_stem_x"] if item["_stem_x"] is not None else item["_num_x"] + 16
            loose = re.match(r"^[A-I] \S", plain) and plain[0] not in seen and (
                state == "choices" or (plain[0] == "A" and l.x > sx + 6 and item["_stem"]))
            if mc and (tabbed or loose):
                item["_choices"].append([mc.group(1), [mc.group(2)], l.x])
                state = "choices"
                i += 1
                continue
            if re.fullmatch(r"[A-I]", plain):
                item["_choices"].append([plain, [], l.x])
                state = "choices"
                i += 1
                continue
            if state == "choices" and item["_choices"]:
                # continuation of the nearest choice to the left
                best = min(item["_choices"], key=lambda c: abs((c[2] + 18) - l.x) if l.x >= c[2] else 999)
                best = [c for c in item["_choices"] if c[2] <= l.x + 2]
                (best[-1] if best else item["_choices"][-1])[1].append(l.text)
                i += 1
                continue
            if item["_stem_x"] is None:
                item["_stem_x"] = l.x
            item["_stem"].append(l.text)
            i += 1
            continue

        if state == "expl":
            buf.append(l)
        i += 1

    if state == "passage":
        flush_passage()
    if cur_set is not None:
        flush_item()
    return sets


def _looks_like_question(ls: list[Line], i: int) -> bool:
    """An "N." line inside an explanation could be a list; a real question is
    followed (soon) by choices or an Explanation header."""
    for l in ls[i + 1:i + 40]:
        if l.plain == "Explanation" and l.text.startswith("**"):
            return True
        if QNUM.match(l.plain) and l.x < 150:
            return False
    return False


def _finish_item(it: dict) -> None:
    stem = join(it.pop("_stem"))
    raw_choices = it.pop("_choices")
    choices = [(c[0], join(c[1])) for c in raw_choices]
    xs = [c[2] for c in raw_choices]
    multi = it.pop("_multi")
    it.pop("_cols")
    it.pop("_stem_x")
    it.pop("_num_x")
    t = it["type"]
    if t == "TC":
        text, nb = blanks_to_markers(stem)
        it["text"] = text
        if nb <= 1:
            it["blanks"] = [{"index": 1, "choices": [{"id": c, "text": strip_marks(x)} for c, x in choices]}]
        else:
            # Group by column (x), not by printed letter: the book misletters a
            # few columns; on the test the letters run A–C, D–F, G–I.
            cols: list[list] = []
            for (c, x), cx in zip(choices, xs):
                for col in cols:
                    if abs(col[0] - cx) < 25:
                        col[1].append(x)
                        break
                else:
                    cols.append([cx, [x]])
            cols.sort(key=lambda c: c[0])
            if len(cols) != nb or any(len(c[1]) != 3 for c in cols):
                raise ValueError(f"TC Q{it['n']}: {nb} blanks, columns {[(round(c[0]), c[1]) for c in cols]}")
            it["blanks"] = [{"index": k + 1, "choices": [{"id": "ABCDEFGHI"[3 * k + j], "text": strip_marks(x)}
                                                         for j, x in enumerate(col[1])]}
                            for k, col in enumerate(cols)]
    elif t == "SE":
        text, _ = blanks_to_markers(stem)
        it["text"] = text
        it["choices"] = [{"id": c, "text": strip_marks(x)} for c, x in choices]
    else:
        it["stem"] = stem
        if not choices and re.search(r"\bselect the sentence\b", stem, re.I):
            it["format"] = "sentence"
        else:
            it["format"] = "multi" if multi else "single"
            it["choices"] = [{"id": c, "text": x} for c, x in choices]
    it.setdefault("explanation", [])


def _paragraphs(buf: list[Line], margin: list[Line]) -> list[str]:
    """Passage paragraphs; a paragraph starts on an indented line. Margin line
    numbers (5, 10, …) become ⟦n⟧ before the line they sit beside."""
    if not buf:
        return []
    left = min(l.x for l in buf)
    nums = [(m.page, m.y, int(strip_marks(m.plain))) for m in margin if strip_marks(m.plain).isdigit()]
    at: dict[int, int] = {}
    for (pg, y, n) in nums:
        cands = [k for k, l in enumerate(buf) if l.page == pg and abs(l.y - y) < 12]
        if cands:
            at[min(cands, key=lambda k: abs(buf[k].y - y))] = n
    paras: list[list[str]] = []
    for k, l in enumerate(buf):
        t = l.text
        if k in at:
            t = f"⟦{at[k]}⟧" + t
        if not paras or l.x > left + 8:
            paras.append([t])
        else:
            paras[-1].append(t)
    out = []
    for p in paras:
        s = join(p)
        # A line number that lands inside a word broken across lines goes
        # before the whole word.
        s = re.sub(r"(\w+)⟦(\d+)⟧(\w+)", r"⟦\2⟧\1\3", s)
        # The Verbal book drops the hyphen of a few words broken at a line end.
        s = re.sub(r"\b(depart|atten|surviv) ⟦(\d+)⟧(ments|tion|ing)\b", r"⟦\2⟧\1\3", s)
        s = re.sub(r"(\S)⟦", r"\1 ⟦", s)
        s = re.sub(r"⟦(\d+)⟧\s+", r"⟦\1⟧", s)
        out.append(s)
    return out


def _expl_paragraphs(buf: list[Line]) -> list[str]:
    if not buf:
        return []
    left = min(l.x for l in buf)
    paras: list[list[str]] = []
    for l in buf:
        starts = l.x > left + 8 or l.plain.startswith("\t") or l.text.lstrip().startswith("\t")
        if not paras or starts:
            paras.append([l.text])
        else:
            paras[-1].append(l.text)
    return [join(p) for p in paras if join(p)]


# ── answer key ────────────────────────────────────────────────────────────

def parse_key(doc, pages: range) -> dict[int, dict[int, dict]]:
    """{set: {n: {"letters": [...], "texts": {letter: text}, "raw": str}}}"""
    ls = lines(doc, pages)
    out: dict[int, dict[int, dict]] = {}
    cur = None
    n = None
    acc: dict[int, list[str]] = {}
    started = False
    for l in ls:
        p = strip_marks(l.plain)
        if re.match(r"^ANSWER KEY", p, re.I):
            started = True
            continue
        if not started:
            continue
        if re.match(r"^Answers and Explanations", p):
            break
        m = SET_HDR.match(p)
        if m:
            cur = out.setdefault(int(m.group(1)), {})
            n = None
            continue
        if cur is None:
            cur = out.setdefault(1, {})
        mq = QNUM.match(p)
        if mq and l.x < 150:
            n = int(mq.group(1))
            acc[id(cur) * 100 + n] = [mq.group(2)] if mq.group(2) else []
            cur[n] = {"_k": id(cur) * 100 + n}
            continue
        if n is not None:
            acc[cur[n]["_k"]].append(p)
    for s in out.values():
        for n, v in s.items():
            raw = re.sub(r"\s+", " ", " ".join(acc[v.pop("_k")]).replace(SOFT, "")).strip()
            v["raw"] = raw
            parts = re.split(r"(?:;?\s*AND\s*)?(?:;\s*)?Choice ([A-I]):\s*", raw)
            letters, texts = [], {}
            for k in range(1, len(parts), 2):
                letters.append(parts[k])
                texts[parts[k]] = parts[k + 1].strip().rstrip(";").strip()
            v["letters"] = letters
            v["texts"] = texts
            m = re.match(r"^Sentence (\d+):\s*(.*)$", raw)
            if m:
                v["sentence"] = int(m.group(1))
                v["sentenceText"] = m.group(2)
    return out


def norm(s: str) -> str:
    s = strip_marks(s).lower().replace(SOFT, "")
    s = re.sub(r"[‘’“”\"']", "", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def check(items: list[dict], key: dict[int, dict], label: str) -> list[str]:
    """Every keyed choice text must match the parsed choice text."""
    problems = []
    for it in items:
        k = key.get(it["n"])
        if not k:
            problems.append(f"{label} Q{it['n']}: no key")
            continue
        if "sentence" in k:
            continue
        pool = {}
        for c in it.get("choices", []) or []:
            pool[c["id"]] = c["text"]
        for b in it.get("blanks", []) or []:
            for c in b["choices"]:
                pool[c["id"]] = c["text"]
        for letter in k["letters"]:
            want = norm(k["texts"].get(letter, ""))
            got = norm(pool.get(letter, ""))
            if not got or (want[:30] != got[:30]):
                problems.append(f"{label} Q{it['n']} {letter}: key '{k['texts'].get(letter)}' vs parsed '{pool.get(letter)}'")
        if it["type"] == "TC" and len(k["letters"]) != len(it["blanks"]):
            problems.append(f"{label} Q{it['n']}: {len(k['letters'])} keyed vs {len(it['blanks'])} blanks")
        if it["type"] == "SE" and (len(k["letters"]) != 2 or len(it["choices"]) != 6):
            problems.append(f"{label} Q{it['n']}: SE shape {k['letters']} / {len(it['choices'])} choices")
        if it["type"] == "RC" and it.get("format") == "single" and len(k["letters"]) != 1:
            problems.append(f"{label} Q{it['n']}: single-answer RC keyed {k['letters']}")
    return problems
