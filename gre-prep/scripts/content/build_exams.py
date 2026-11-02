"""Build the two full-length practice tests from the Official Guide PDF.

    python3 -I scripts/content/build_exams.py "/path/to/The Official Guide to the GRE General Test, 3rd Edition.pdf"

Writes, per test:
    private/official-tests/test-N.json       what the browser may see (no answers)
    private/official-tests/test-N.key.json   answers, explanations, score tables —
                                     imported by server code only
    public/official-tests/test-N/...          cropped quant stems, choices, exhibits
                                     and explanations (WebP)

The structure follows the book's own tests: two writing tasks, two verbal
sections and two quantitative sections of 25 questions each.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf as fitz

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "private" / "scripts"))  # ETS transcriptions, private
from exam_keys import letters, parse_conversion, parse_keys  # noqa: E402
from exam_quant import analyse, render_explanations, render_figures  # noqa: E402
from quant_text import EXHIBITS, T as TRANSCRIPTS  # noqa: E402
from exam_text import (El, elements, parse_verbal, reflow, section_elements,  # noqa: E402
                       verbal_explanations)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "private" / "official-tests"
PUBLIC = ROOT / "public" / "official-tests"

# 1-based page ranges inside the Official Guide PDF.
TESTS = {
    1: dict(
        writing=(465, 468), issue_end="SECTION 2",
        verbal={3: range(468, 480), 4: range(479, 491)},
        quant={5: range(490, 502), 6: range(501, 513)},
        verbal_expl={3: range(544, 564), 4: range(563, 585)},
        quant_expl={5: range(584, 610), 6: range(610, 638)},
        samples={1: range(523, 534), 2: range(533, 544)},
    ),
    2: dict(
        writing=(639, 642), issue_end="SECTION 2",
        verbal={3: range(642, 655), 4: range(654, 667)},
        quant={5: range(667, 678), 6: range(678, 690)},
        verbal_expl={3: range(722, 744), 4: range(743, 766)},
        quant_expl={5: range(765, 792), 6: range(792, 819)},
        samples={1: range(699, 711), 2: range(710, 722)},
    ),
}

# Answers the key prints as images the text layer cannot read (checked by eye
# against the key pages). {(test, section): {n: answer}}
KEY_OVERRIDES = {
    (1, 6): {11: ["A", "B", "C"], 16: ["A", "B"], 22: ["D"], 23: ["B"],
             24: {"fraction": [153, 190]}},
    (2, 6): {20: {"fraction": [44, 68]}},
}

# Units printed beside numeric-entry boxes live in quant_text.py (`unit`).

DIRECTIONS = {
    "issue": "You will be given a brief quotation that states or implies an issue of general interest and specific instructions on how to respond to that issue. You will then have 30 minutes to plan and compose a response according to the specific instructions. A response to any other issue will receive a score of zero.",
    "argument": "You will be given a short passage that presents an argument and specific instructions on how to respond to that passage. You will then have 30 minutes to plan and compose a response in which you evaluate the passage according to the specific instructions. Note that you are NOT being asked to present your own views on the subject.",
    "verbal": "For each question, select the answer choice(s) as directed. For Text Completion, select one entry for each blank; for Sentence Equivalence, select the two answer choices that complete the sentence in a way that gives it the same meaning. Questions about a passage should be answered on the basis of what is stated or implied in it.",
    "quant": "Notes: All numbers used are real numbers. All figures are assumed to lie in a plane unless otherwise indicated. Geometric figures, such as lines, circles, triangles, and quadrilaterals, are not necessarily drawn to scale. That is, you should not assume that quantities such as lengths and angle measures are as they appear in a figure. You should assume, however, that lines shown as straight are actually straight, points on a line are in the order shown, and more generally, all geometric objects are in the relative positions shown. For questions with geometric figures, you should base your answers on geometric reasoning, not on estimating or comparing quantities by sight or by measurement. Coordinate systems, such as xy-planes and number lines, are drawn to scale; therefore, you can read, estimate, or compare quantities in such figures by sight or by measurement. Graphical data presentations, such as bar graphs, circle graphs, and line graphs, are drawn to scale; therefore, you can read, estimate, or compare data values by sight or by measurement.",
}


# ── Writing ───────────────────────────────────────────────────────────────

def writing_prompts(doc, pages: tuple[int, int]) -> dict:
    els = [e for e in elements(doc, range(*pages), markup=False) if e.kind == "line"]
    texts = [e.plain.strip() for e in els]

    def block(start_pat: str, stop_pat: str) -> list[El]:
        i = next(k for k, t in enumerate(texts) if re.fullmatch(start_pat, t))
        out = []
        for e in els[i + 1:]:
            if re.match(stop_pat, e.plain.strip()):
                break
            out.append(e)
        return out

    def split(lines: list[El]) -> tuple[list[str], list[str]]:
        k = next(i for i, e in enumerate(lines) if e.plain.strip().startswith("Write a response"))
        return reflow(lines[:k], indent_gap=6.0), reflow(lines[k:], indent_gap=6.0)

    issue_topic, issue_task = split(block(r"Issue Topic", r"SECTION 2|NO TEST MATERIAL"))
    arg_topic, arg_task = split(block(r"Argument Topic", r"NO TEST MATERIAL|STOP|SECTION 3"))
    return {
        "issue": {"topic": issue_topic, "task": " ".join(issue_task)},
        "argument": {"topic": arg_topic, "task": " ".join(arg_task)},
    }


def sample_essays(doc, pages: range) -> list[dict]:
    """[{score, response: [paras], commentary: [paras]}] in book order."""
    els = [e for e in elements(doc, pages, markup=False) if e.kind == "line"]
    out: list[dict] = []
    cur = None
    mode = None
    buf: list[El] = []

    def flush():
        nonlocal buf
        if cur is not None and mode:
            cur[mode] = reflow(buf, indent_gap=4.0)
        buf = []

    for e in els:
        t = e.plain.strip()
        m = re.match(r"^Score (\d) Response", t)
        if m:
            flush()
            cur = {"score": int(m.group(1)), "response": [], "commentary": []}
            out.append(cur)
            mode = "response"
            continue
        if t == "Reader Commentary":
            flush()
            mode = "commentary"
            continue
        if cur is not None and mode:
            if re.match(r"^(SECTION \d|Analytical Writing Sample|Answers and Explanations)", t):
                continue
            buf.append(e)
    flush()
    return out


# ── Verbal ────────────────────────────────────────────────────────────────

ABBREV = re.compile(r"(?:\b[A-Z]|\bMr|\bMrs|\bMs|\bDr|\bSt|\bJr|\bSr|\bvs|\be\.g|\bi\.e|\bNo|\bU\.S|\bInc|\bCo)\.$")


def split_sentences(paragraph: str) -> list[str]:
    parts = re.split(r"(?<=[.?!])([\"”’)]*)\s+(?=[A-Z“\"‘(*⟦])", paragraph)
    # re.split with a group interleaves captures: [text, cap, text, cap, ...]
    sentences: list[str] = []
    i = 0
    while i < len(parts):
        s = parts[i]
        if i + 1 < len(parts):
            s += parts[i + 1]
        i += 2
        if sentences and ABBREV.search(sentences[-1].rstrip()):
            sentences[-1] += " " + s
        else:
            sentences.append(s)
    return [s.strip() for s in sentences if s.strip()]


def clean(s: str) -> str:
    s = re.sub(r"\*(?=\S)([^*]+?)\*\s+\*(?=\S)", r"*\1 ", s)
    s = re.sub(r"(\*\*)\s+\*\*", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def strip_markers(s: str) -> str:
    return re.sub(r"⟦\d+⟧|\*+", "", s)


def build_verbal(doc, test: int, section: int, pages: range, key: dict, expl_pages: range) -> tuple[dict, dict]:
    parsed = parse_verbal(section_elements(doc, pages, section))
    passages = []
    for p in parsed["passages"]:
        pid = f"s{section}-{p['id']}"
        paras = [clean(x) for x in p["paragraphs"]]
        passages.append({"id": pid, "paragraphs": paras,
                         "sentences": [split_sentences(x) for x in paras]})
    pid_map = {p["id"]: f"s{section}-{p['id']}" for p in parsed["passages"]}
    expl = verbal_explanations(section_elements(doc, expl_pages, section))

    items, keys = [], {}
    for it in parsed["items"]:
        n = it["n"]
        raw = key[n]["raw"]
        letter_ids = letters(raw)
        out = {"n": n, "type": it["type"]}
        ans: dict
        if it["type"] == "TC":
            out["text"] = clean(it["text"])
            out["blanks"] = [{"index": b["index"], "choices": [{"id": c["id"], "text": clean(c["text"])} for c in b["choices"]]}
                             for b in it["blanks"]]
            ans = {"blanks": letter_ids}
            assert len(letter_ids) == len(out["blanks"]), (test, section, n, letter_ids)
        elif it["type"] == "SE":
            out["text"] = clean(it["text"])
            out["choices"] = [{"id": c["id"], "text": clean(c["text"])} for c in it["choices"]]
            ans = {"choices": letter_ids}
            assert len(letter_ids) == 2, (test, section, n, raw)
        else:
            out["passageId"] = pid_map[it["passageId"]]
            out["stem"] = clean(it["stem"])
            out["format"] = it["format"]
            if it["format"] == "sentence":
                m = re.match(r"^Sentence (\d+):\s*(.*)$", raw)
                assert m, (test, section, n, raw)
                idx = int(m.group(1))
                psg = next(p for p in passages if p["id"] == out["passageId"])
                flat = [s for para in psg["sentences"] for s in para]
                want = strip_markers(m.group(2))[:40].strip()
                got = strip_markers(flat[idx - 1])[:40].strip()
                if want[:25] != got[:25]:
                    print(f"  ! sentence mismatch T{test}S{section}Q{n}: key {idx} '{want}' vs '{got}'")
                ans = {"sentence": idx}
            else:
                out["choices"] = [{"id": c["id"], "text": clean(c["text"])} for c in it["choices"]]
                ans = {"choices": letter_ids}
                assert letter_ids, (test, section, n, raw)
        items.append(out)
        keys[str(n)] = {"answer": ans, "p": key[n]["p"], "explanation": [clean(x) for x in expl.get(n, [])]}
    return ({"passages": passages, "items": items}, keys)


# ── Quant ─────────────────────────────────────────────────────────────────

def build_quant(doc, test: int, section: int, pages: range, key: dict, expl_pages: range) -> tuple[dict, dict]:
    out_dir = PUBLIC / f"test-{test}" / f"s{section}"
    prefix = f"/official-tests/test-{test}/s{section}"
    shells = render_figures(doc, pages, out_dir, prefix)
    qs, _, info = analyse(doc, pages)
    expl = render_explanations(doc, expl_pages, qs, info["nums"], out_dir / "e", f"{prefix}/e")
    over = KEY_OVERRIDES.get((test, section), {})
    text = TRANSCRIPTS[(test, section)]
    typed_exhibits = EXHIBITS.get((test, section), {})

    exhibits: dict[str, dict] = {}
    group_of: dict[int, int] = {}
    for sh in shells:
        if "exhibitFirst" in sh:
            first = str(sh["exhibitFirst"])
            ex = dict(typed_exhibits.get(first, {}))
            if "exhibit" in sh:
                ex["img"] = sh["exhibit"]
            assert ex, (test, section, first)
            exhibits[first] = ex
            for k in range(sh["exhibitFirst"], sh["exhibitLast"] + 1):
                group_of[k] = sh["exhibitFirst"]

    items, keys = [], {}
    for sh in shells:
        n = sh["n"]
        t = text[n]
        item: dict = {"n": n, "type": sh["type"], "format": sh["format"]}
        for field in ("common", "a", "b", "stem", "label", "unit", "table"):
            if field in t:
                item[field] = t[field]
        if "figure" in sh:
            item["figure"] = sh["figure"]
        if n in group_of:
            item["exhibit"] = str(group_of[n])
        if sh["type"] == "QC":
            assert "a" in t and "b" in t, (test, section, n)
        else:
            assert "stem" in t, (test, section, n)
        if sh["type"] == "PS":
            ch = t["choices"]
            item["choices"] = [{"id": "ABCDEFGHI"[i], "text": c} for i, c in enumerate(ch)]
        raw = key[n]["raw"]
        if n in over:
            o = over[n]
            ans = {"fraction": o["fraction"]} if isinstance(o, dict) else {"choices": o}
        elif sh["type"] == "NE":
            ans = {"value": float(raw.split()[0].replace(",", ""))}
        else:
            ids = letters(raw)
            assert ids, (test, section, n, raw)
            ans = {"choice": ids[0]} if sh["type"] == "QC" else {"choices": ids}
            if sh["type"] == "PS":
                assert all(i in [c["id"] for c in item["choices"]] for i in ids), (test, section, n, ids)
        if sh["type"] == "NE" and sh["format"] == "fraction":
            assert "fraction" in ans, (test, section, n)
        items.append(item)
        keys[str(n)] = {"answer": ans, "p": key[n]["p"], "explanation": expl.get(n)}
    return ({"exhibits": exhibits, "items": items}, keys)


# ── Orchestration ─────────────────────────────────────────────────────────

def build(pdf: str, test: int) -> None:
    cfg = TESTS[test]
    doc = fitz.open(pdf)
    keys = parse_keys(pdf, test)
    conversion = parse_conversion(pdf, test)
    prompts = writing_prompts(doc, cfg["writing"])
    samples = {s: sample_essays(doc, r) for s, r in cfg["samples"].items()}

    sections, keyed = [], {}
    sections.append({"id": "s1", "number": 1, "kind": "issue", "title": "Analytical Writing — Analyze an Issue",
                     "minutes": 30, "directions": DIRECTIONS["issue"], "prompt": prompts["issue"]})
    sections.append({"id": "s2", "number": 2, "kind": "argument", "title": "Analytical Writing — Analyze an Argument",
                     "minutes": 30, "directions": DIRECTIONS["argument"], "prompt": prompts["argument"]})
    keyed["s1"] = {"samples": samples[1]}
    keyed["s2"] = {"samples": samples[2]}

    for number, pages in cfg["verbal"].items():
        print(f"test {test} section {number} (verbal)")
        content, k = build_verbal(doc, test, number, pages, keys[number], cfg["verbal_expl"][number])
        sections.append({"id": f"s{number}", "number": number, "kind": "verbal",
                         "title": "Verbal Reasoning", "minutes": 35, "directions": DIRECTIONS["verbal"], **content})
        keyed[f"s{number}"] = k
    for number, pages in cfg["quant"].items():
        print(f"test {test} section {number} (quant)")
        content, k = build_quant(doc, test, number, pages, keys[number], cfg["quant_expl"][number])
        sections.append({"id": f"s{number}", "number": number, "kind": "quant",
                         "title": "Quantitative Reasoning", "minutes": 40, "directions": DIRECTIONS["quant"], **content})
        keyed[f"s{number}"] = k

    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"test-{test}.json").write_text(json.dumps({
        "id": f"test-{test}", "number": test, "title": f"GRE Practice Test {test}",
        "source": "The Official Guide to the GRE General Test, 3rd Edition (ETS)",
        "sections": sections,
    }, ensure_ascii=False, indent=1) + "\n")
    (DATA / f"test-{test}.key.json").write_text(json.dumps({
        "sections": keyed,
        "conversion": {k: {str(r): s for r, s in v.items()} for k, v in conversion.items()},
    }, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    pdf = sys.argv[1]
    for t in (1, 2):
        build(pdf, t)
