"""Build the extra official material: practice sets and Official Tests 3–5.

    python3 -I scripts/content/build_official_sets.py \
        --guide  "/path/The Official Guide to the GRE General Test, 3rd Edition.pdf" \
        --verbal "/path/Official GRE Verbal Reasoning Practice Questions, 2nd ed.pdf" \
        --quant  "/path/Official GRE Quantitative Reasoning Practice Questions, 2nd ed.pdf"

Sources and what becomes of them
  Official Guide ch. 4   six Verbal sets (easy → hard)          → practice sets og-v1…og-v6
  Official Guide ch. 6   four Quant sets (easy → hard, DI)      → practice sets og-q1…og-q4
  Verbal book ch. 3–5    RC / TC / SE, easy-medium-hard each    → practice sets vb-rc-1… vb-se-3
  Verbal book ch. 6      three mixed sets of 25                 → Verbal section of tests 3, 4, 5
  Verbal book ch. 7      3 Issue + 3 Argument tasks, samples    → writing sections of tests 3, 4, 5
  Quant book ch. 3–6     arithmetic, algebra, geometry, data    → practice sets qb-arith … qb-data
  Quant book ch. 7       three mixed sets of 25                 → Quant section of tests 3, 4, 5

Writes (all inside the private submodule, never shipped publicly):
  private/official-tests/test-{3,4,5}.json / .key.json
  private/official-sets/index.json, <id>.json, <id>.key.json
  private/media/official-sets/<id>/…   (quant figures and explanation crops, WebP)

Scores. ETS publishes no conversion table for these books. A mixed set is a
paper-test section (25 questions, test-like mix of difficulty), so a raw score
r out of 25 is placed on the official 50-question tables of Practice Tests 1–2
at 2r and the two tables are averaged; the result is flagged as an estimate.
The books give no P+ either, so items carry the book's own difficulty label
(Easy / Medium / Hard) where it prints one, and no P+.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pymupdf as fitz

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "private" / "scripts"))

from book_verbal import check, join, lines, parse_key, parse_sets, strip_marks  # noqa: E402
from build_exams import DIRECTIONS, clean, split_sentences  # noqa: E402
from exam_text import elements, parse_verbal, verbal_explanations  # noqa: E402

PRIVATE = ROOT / "private"
SETS = PRIVATE / "official-sets"
TESTS = PRIVATE / "official-tests"

VERBAL_MIN_PER_Q = 35 / 25
QUANT_MIN_PER_Q = 40 / 25

# ── Page maps (1-based PDF pages, checked against each book) ─────────────

VB_CHAPTERS = {
    # name: (explanation pages, key pages, kind label, difficulty by set)
    "rc": (range(49, 71), range(47, 49), "Reading Comprehension"),
    "tc": (range(80, 93), range(79, 80), "Text Completion"),
    "se": (range(102, 115), range(101, 102), "Sentence Equivalence"),
}
VB_MIXED = {3: (range(126, 140), range(125, 126)), 4: (range(150, 166), range(149, 150)),
            5: (range(176, 193), range(175, 176))}
LEVEL = {1: "easy", 2: "medium", 3: "hard"}

OG_VERBAL = dict(questions=range(87, 113), key=range(112, 115), explanations=range(114, 157))
OG_VERBAL_TITLES = {1: ("Discrete questions", "easy"), 2: ("Reading Comprehension", "easy"),
                    3: ("Discrete questions", "medium"), 4: ("Reading Comprehension", "medium"),
                    5: ("Discrete questions", "hard"), 6: ("Reading Comprehension", "hard")}

# The Official Guide PDF (an e-book conversion) scrambles two choice columns;
# restored from its own answer key and column structure.
OG_VERBAL_FIX = {
    (3, 4): {"E": "aside from supporting", "F": "far from exaggerating", "H": "protect", "I": "disseminate"},
    (5, 4): {"E": "intractable prolixity", "H": "volubility"},
}

# Writing: (prompt page, heading, sample pages, stop heading) per task.
WRITING = {
    3: {"issue": (202, "Sample Issue Task", range(203, 210), "Practice Analyze an Issue Tasks"),
        "argument": (214, "Sample Argument Task", range(216, 222), "Practice Analyze an Argument Tasks")},
    4: {"issue": (209, "Task 1", range(228, 235), "Task 2"),
        "argument": (221, "Task 1", range(242, 249), "Task 2")},
    5: {"issue": (209, "Task 2", range(235, 242), "Scored Sample Essays"),
        "argument": (222, "Task 2", range(249, 258), "@@end")},
}


# ── Helpers ───────────────────────────────────────────────────────────────

def passage_out(sid: str, p: dict) -> dict:
    paras = [clean(x) for x in p["paragraphs"]]
    return {"id": f"{sid}-{p['id']}", "paragraphs": paras, "sentences": [split_sentences(x) for x in paras]}


def verbal_section(sid: str, number: int, title: str, parsed: dict, key: dict, label: str,
                   difficulty: str | None = None, fixes: dict | None = None) -> tuple[dict, dict]:
    """ExamContent section + key entries from parsed items and the book key."""
    passages = [passage_out(sid, p) for p in parsed["passages"]]
    items, keys = [], {}
    for it in parsed["items"]:
        n = it["n"]
        out = {"n": n, "type": it["type"]}
        if fixes and n in fixes:
            for b in it.get("blanks", []):
                for c in b["choices"]:
                    c["text"] = fixes[n].get(c["id"], c["text"])
            for c in it.get("choices", []) or []:
                c["text"] = fixes[n].get(c["id"], c["text"])
        k = key[n]
        if it["type"] == "TC":
            out["text"] = clean(it["text"])
            out["blanks"] = [{"index": b["index"], "choices": [{"id": c["id"], "text": clean(c["text"])} for c in b["choices"]]}
                             for b in it["blanks"]]
            ans = {"blanks": k["letters"]}
        elif it["type"] == "SE":
            out["text"] = clean(it["text"])
            out["choices"] = [{"id": c["id"], "text": clean(c["text"])} for c in it["choices"]]
            ans = {"choices": k["letters"]}
        else:
            out["passageId"] = f"{sid}-{it['passageId']}"
            out["stem"] = clean(it["stem"])
            out["format"] = it["format"]
            if it["format"] == "sentence":
                ans = {"sentence": k["sentence"]}
            else:
                out["choices"] = [{"id": c["id"], "text": clean(c["text"])} for c in it["choices"]]
                ans = {"choices": k["letters"]}
        items.append(out)
        entry = {"answer": ans, "p": None, "explanation": [clean(x) for x in it.get("explanation", [])]}
        if difficulty:
            entry["difficulty"] = difficulty
        keys[str(n)] = entry
    probs = check(parsed["items"], key, label)
    if probs:
        raise SystemExit("\n".join(probs))
    section = {"id": sid, "number": number, "kind": "verbal", "title": title,
               "minutes": max(5, round(len(items) * VERBAL_MIN_PER_Q)), "directions": DIRECTIONS["verbal"],
               "passages": passages, "items": items}
    return section, keys


def estimated_conversion() -> dict:
    """0..25 → 130..170 per measure, from the two official 50-question tables."""
    tables = []
    for t in (1, 2):
        k = json.loads((TESTS / f"test-{t}.key.json").read_text())
        tables.append(k["conversion"])
    out = {}
    for m in ("verbal", "quant"):
        out[m] = {str(r): round(sum(tb[m][str(2 * r)] for tb in tables) / len(tables)) for r in range(26)}
    return out


def write_pair(folder: Path, id_: str, content: dict, key: dict) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{id_}.json").write_text(json.dumps(content, ensure_ascii=False, indent=1) + "\n")
    (folder / f"{id_}.key.json").write_text(json.dumps(key, ensure_ascii=False, indent=1) + "\n")


# ── Verbal sources ────────────────────────────────────────────────────────

def og_verbal_sets(doc) -> list[tuple[str, dict, dict, dict]]:
    def split(els, stop_at_key=False):
        out, cur = {}, None
        for e in els:
            t = e.plain.strip() if e.kind == "line" else ""
            m = re.match(r"^SET (\d)\.", t)
            if m:
                cur = int(m.group(1))
                out[cur] = []
                continue
            if t == "ANSWER KEY" and stop_at_key:
                break
            if t == "Answers and Explanations":
                out, cur = {}, None
                continue
            if cur:
                out[cur].append(e)
        return out

    q = split(elements(doc, OG_VERBAL["questions"]), True)
    a = split(elements(doc, OG_VERBAL["explanations"]))
    keys = parse_key(doc, OG_VERBAL["key"])
    res = []
    for s in sorted(q):
        nk = len(keys[s])
        parsed = parse_verbal(q[s], n_questions=nk)
        ex = verbal_explanations(a[s], n_questions=nk)
        for it in parsed["items"]:
            it["explanation"] = ex.get(it["n"], [])
            if it["type"] == "RC" and "passageId" not in it:
                # A one-paragraph argument printed with its question: the last
                # sentence asks, the rest is the passage.
                sents = split_sentences(it["stem"])
                assert len(sents) >= 2 and re.search(r"[?:]$|\bwhich\b", sents[-1], re.I), it["stem"]
                pid = f"p{len(parsed['passages']) + 1}"
                parsed["passages"].append({"id": pid, "paragraphs": [" ".join(sents[:-1])]})
                it["passageId"] = pid
                it["stem"] = sents[-1]
        what, level = OG_VERBAL_TITLES[s]
        sid = "s1"
        section, k = verbal_section(sid, 1, "Verbal Reasoning", parsed, keys[s], f"og-v{s}",
                                    difficulty=level, fixes=OG_VERBAL_FIX and {n: f for (st, n), f in OG_VERBAL_FIX.items() if st == s})
        meta = {"id": f"og-v{s}", "book": "guide", "measure": "verbal", "group": "Official Guide · Verbal",
                "title": f"Verbal Set {s} · {what}", "level": level}
        res.append((meta["id"], meta, section, k))
    return res


def vb_chapter_sets(doc) -> list[tuple[str, dict, dict, dict]]:
    res = []
    for name, (ae, kp, label) in VB_CHAPTERS.items():
        sets = parse_sets(doc, ae)
        keys = parse_key(doc, kp)
        for s, parsed in sorted(sets.items()):
            level = LEVEL[s]
            section, k = verbal_section("s1", 1, "Verbal Reasoning", parsed, keys[s], f"vb-{name}-{s}", difficulty=level)
            meta = {"id": f"vb-{name}-{s}", "book": "verbal", "measure": "verbal", "group": "Verbal Practice Questions",
                    "title": f"{label} · {level.capitalize()}", "level": level}
            res.append((meta["id"], meta, section, k))
    return res


def vb_mixed(doc, test: int) -> tuple[dict, dict]:
    ae, kp = VB_MIXED[test]
    sets = parse_sets(doc, ae)
    assert len(sets) == 1, sets.keys()
    parsed = next(iter(sets.values()))
    keys = parse_key(doc, kp)
    key = next(iter(keys.values()))
    return verbal_section("s3", 3, "Verbal Reasoning", parsed, key, f"test-{test} verbal")


# ── Writing ───────────────────────────────────────────────────────────────

def writing_task(doc, page: int, heading: str) -> dict:
    ls = lines(doc, range(page, page + 2))
    i = next(k for k, l in enumerate(ls) if strip_marks(l.plain).strip() == heading)
    body = []
    for l in ls[i + 1:]:
        p = strip_marks(l.plain).strip()
        if l.text.startswith("**") or p.startswith("You may choose"):
            break
        body.append(l)
    k = next(j for j, l in enumerate(body) if re.match(r"^(Write a response|Discuss the extent)", l.plain.strip()))
    topic_lines, task_lines = body[:k], body[k:]
    paras: list[list[str]] = []
    for l in topic_lines:
        if not paras or re.match(r"^(Claim|Reason):", l.plain.strip()) or l.plain.strip().startswith("“") and paras and paras[-1][-1].rstrip().endswith("."):
            paras.append([l.text])
        else:
            paras[-1].append(l.text)
    topic = [re.sub(r"\s+", " ", strip_marks(join(p))) for p in paras]
    return {"topic": topic, "task": re.sub(r"\s+", " ", strip_marks(join([l.text for l in task_lines])))}


def writing_samples(doc, pages: range, stop: str) -> list[dict]:
    ls = lines(doc, pages)
    out, cur, mode, buf = [], None, None, []

    def flush():
        nonlocal buf
        if cur is not None and mode:
            left = min((l.x for l in buf), default=0)
            paras: list[list[str]] = []
            for l in buf:
                if not paras or l.x > left + 8:
                    paras.append([l.text])
                else:
                    paras[-1].append(l.text)
            cur[mode] = [strip_marks(join(p)) for p in paras if join(p)]
        buf = []

    for l in ls:
        p = strip_marks(l.plain).strip()
        m = re.match(r"^Score (\d) Response", p)
        if m and l.text.startswith("**"):
            flush()
            cur = {"score": int(m.group(1)), "response": [], "commentary": []}
            out.append(cur)
            mode = "response"
            continue
        if p.startswith("Reader Commentary") and l.text.startswith("**"):
            flush()
            mode = "commentary"
            continue
        if l.text.startswith("**") and p.startswith(stop):
            break
        if l.text.startswith("**") and re.match(r"^(Task \d|Scored Sample Essays|Practice Analyze)", p):
            if cur is not None:
                break
            continue
        if cur is not None and mode:
            buf.append(l)
    flush()
    assert [s["score"] for s in out] == [6, 5, 4, 3, 2, 1], [s["score"] for s in out]
    return out


# ── Quant (transcriptions live in the private submodule) ─────────────────

def quant_sources():
    try:
        import book_quant  # noqa: F401  (public code: cropping)
        import book_quant_text  # noqa: F401  (private transcription)
    except ImportError as e:  # quant not transcribed yet
        print(f"  (quant skipped: {e})")
        return None
    return book_quant


# ── Orchestration ─────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--guide", required=True)
    ap.add_argument("--verbal", required=True)
    ap.add_argument("--quant", required=True)
    args = ap.parse_args()
    og = fitz.open(args.guide)
    vb = fitz.open(args.verbal)
    qb = fitz.open(args.quant)
    conv25 = estimated_conversion()
    bq = quant_sources()

    index = []

    def add_set(id_, meta, section, key_entries, source):
        n = len(section["items"])
        content = {"id": id_, "number": 0, "title": meta["title"], "source": source, "kind": "set",
                   "sections": [section]}
        key = {"sections": {section["id"]: key_entries}, "conversion": {"verbal": {}, "quant": {}}}
        write_pair(SETS, id_, content, key)
        index.append({**meta, "questions": n, "minutes": section["minutes"]})
        print(f"  {id_:<12} {n:>2} q  {meta['title']}")

    print("Official Guide · Verbal")
    for id_, meta, section, k in og_verbal_sets(og):
        add_set(id_, meta, section, k, "The Official Guide to the GRE General Test, 3rd Edition (ETS), Chapter 4")
    print("Verbal Practice Questions")
    for id_, meta, section, k in vb_chapter_sets(vb):
        add_set(id_, meta, section, k, "Official GRE Verbal Reasoning Practice Questions, 2nd Edition (ETS)")
    if bq:
        print("Official Guide · Quant")
        for id_, meta, section, k in bq.og_quant_sets(og):
            add_set(id_, meta, section, k, "The Official Guide to the GRE General Test, 3rd Edition (ETS), Chapter 6")
        print("Quantitative Practice Questions")
        for id_, meta, section, k in bq.qb_chapter_sets(qb):
            add_set(id_, meta, section, k, "Official GRE Quantitative Reasoning Practice Questions, 2nd Edition (ETS)")

    (SETS / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n")

    for t in (3, 4, 5):
        print(f"Official test {t}")
        w = WRITING[t]
        sections, keyed = [], {}
        for num, kind in ((1, "issue"), (2, "argument")):
            page, heading, spages, stop = w[kind]
            prompt = writing_task(vb, page, heading)
            title = "Analytical Writing — Analyze an Issue" if kind == "issue" else "Analytical Writing — Analyze an Argument"
            sections.append({"id": f"s{num}", "number": num, "kind": kind, "title": title, "minutes": 30,
                             "directions": DIRECTIONS[kind], "prompt": prompt})
            keyed[f"s{num}"] = {"samples": writing_samples(vb, spages, stop)}
        vsec, vkey = vb_mixed(vb, t)
        vsec["minutes"] = 35
        sections.append(vsec)
        keyed["s3"] = vkey
        conversion = {"verbal": conv25["verbal"], "quant": {}}
        mixed = bq.qb_mixed(qb, t) if bq else None
        if mixed:
            qsec, qkey = mixed
            qsec["minutes"] = 40
            sections.append(qsec)
            keyed["s4"] = qkey
            conversion["quant"] = conv25["quant"]
        content = {"id": f"test-{t}", "number": t, "title": f"GRE Practice Test {t}", "kind": "test",
                   "source": "Official GRE Verbal and Quantitative Reasoning Practice Questions, 2nd Editions (ETS) — mixed practice sets",
                   "sections": sections}
        write_pair(TESTS, f"test-{t}", content, {"sections": keyed, "conversion": conversion, "estimated": True})
        print(f"  {sum(len(s.get('items', [])) for s in sections)} questions, writing samples ok")


if __name__ == "__main__":
    main()
