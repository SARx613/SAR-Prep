"""Parse the answer keys and score-conversion tables of the two practice tests."""

import re
import subprocess

OG_NAME = "The Official Guide to the GRE General Test, 3rd Edition_pdf -- ETS -- 3rd Edition.pdf"

# 1-based page ranges inside the Official Guide PDF.
KEY_PAGES = {1: range(514, 522), 2: range(691, 698)}
CONVERSION_PAGES = {1: range(521, 524), 2: range(697, 700)}


def page_text(pdf: str, page: int) -> str:
    return subprocess.run(
        ["pdftotext", "-layout", "-f", str(page), "-l", str(page), pdf, "-"],
        check=True, capture_output=True, text=True,
    ).stdout


def parse_keys(pdf: str, test: int) -> dict[int, dict[int, dict]]:
    """{section: {n: {"p": int, "raw": str}}} for sections 3–6."""
    text = "\n".join(page_text(pdf, p) for p in KEY_PAGES[test])
    out: dict[int, dict[int, dict]] = {}
    section = None
    last = 0
    entry = None
    for line in text.splitlines():
        m = re.match(r"^\s*Section (\d)\. (Verbal|Quantitative) Reasoning", line)
        if m:
            section, last, entry = int(m.group(1)), 0, None
            out[section] = {}
            continue
        if re.match(r"^\s*Score Conversion Table", line):
            break
        if section is None or not line.strip():
            continue
        if re.match(r"^\s*(Answer Key|Question|Number)\b", line):
            continue
        m = re.match(r"^\s*(\d{1,2})\s+(\d{1,3})\s*(.*)$", line)
        if m and int(m.group(1)) == last + 1:
            last = int(m.group(1))
            entry = {"p": int(m.group(2)), "raw": m.group(3).strip()}
            out[section][last] = entry
        elif entry is not None:
            entry["raw"] += " " + line.strip()
    return out


def letters(raw: str) -> list[str]:
    return re.findall(r"Choice ([A-I]):", raw)


def parse_conversion(pdf: str, test: int) -> dict[str, dict[int, int]]:
    text = "\n".join(page_text(pdf, p) for p in CONVERSION_PAGES[test])
    verbal: dict[int, int] = {}
    quant: dict[int, int] = {}
    for line in text.splitlines():
        m = re.match(r"^\s*(\d{1,2})\s+(1\d\d)\s+(1\d\d)\s*$", line)
        if m:
            raw = int(m.group(1))
            verbal[raw], quant[raw] = int(m.group(2)), int(m.group(3))
    return {"verbal": verbal, "quant": quant}
