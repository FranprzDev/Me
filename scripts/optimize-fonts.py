#!/usr/bin/env python3
"""Regenerate the self-hosted web fonts in public/fonts/.

Requirements: pip install fonttools brotli

Each family is downloaded from the Google Fonts css2 API (woff2), optionally
instanced to the weight range the site uses, then split into two files:

  core      ASCII printable + common heading punctuation. Preloaded.
  extended  Latin-1, Latin Extended-A and the other glyphs the site renders.
            Never preloaded; the browser fetches it per missing glyph.

Run this script when the rendered copy gains characters outside the subsets,
when upstream fonts get a new version, or when a weight range changes.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "fonts"
SRC_DIR = ROOT / "src"
VERSION = "v1"

CORE = set(range(0x0020, 0x007F)) | {
    0x2018,
    0x2019,
    0x201C,
    0x201D,
    0x2013,
    0x2014,
    0x2026,
    0x00B7,
}
LATIN = set(range(0x00A0, 0x0100)) | set(range(0x0100, 0x0180))
KEPT_FEATURES = "kern,liga,clig,calt"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)

OXANIUM_BASELINE = 22320

FAMILIES = [
    {
        "id": "oxanium",
        "family": "Oxanium",
        "weights": None,
        "request": "Oxanium:wght@200..800",
        "clamp": "500:700",
        "baseline": OXANIUM_BASELINE,
    },
]


def site_characters() -> set[int]:
    chars: set[int] = set()
    for path in SRC_DIR.rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".css", ".mdx"}:
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            chars.update(ord(ch) for ch in text if ord(ch) > 0x7E)
    return chars


def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def fetch_font(family_request: str, text: str) -> bytes:
    query = urllib.parse.urlencode({"family": family_request, "text": text})
    css = download(f"https://fonts.googleapis.com/css2?{query}").decode("utf-8")
    urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", css)
    if not urls:
        raise RuntimeError(f"No font URL in css2 response for {family_request}")
    return download(urls[0])


def fmt_unicodes(codepoints: set[int]) -> str:
    return ",".join(f"U+{cp:04X}" for cp in sorted(codepoints))


def cmap_codepoints(path: Path) -> set[int]:
    font = TTFont(path)
    points: set[int] = set()
    for table in font["cmap"].tables:
        points.update(table.cmap.keys())
    font.close()
    return points


def axes(path: Path) -> str:
    font = TTFont(path)
    if "fvar" not in font:
        font.close()
        return "static"
    labels = [
        f"{axis.axisTag} {axis.minValue:g}..{axis.maxValue:g}"
        for axis in font["fvar"].axes
    ]
    font.close()
    return ", ".join(labels)


def run(*args: str) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


def subset(source: Path, codepoints: set[int], output: Path) -> None:
    run(
        sys.executable,
        "-m",
        "fontTools.subset",
        str(source),
        f"--unicodes={fmt_unicodes(codepoints)}",
        f"--layout-features={KEPT_FEATURES}",
        "--no-hinting",
        "--desubroutinize",
        "--flavor=woff2",
        f"--output-file={output}",
    )


def instance(source: Path, clamp: str | None, weight: int | None, output: Path) -> Path:
    if clamp:
        run(
            sys.executable,
            "-m",
            "fontTools.varLib.instancer",
            str(source),
            f"wght={clamp}",
            f"--output={output}",
        )
        return output
    if weight is not None and "fvar" in TTFont(source):
        run(
            sys.executable,
            "-m",
            "fontTools.varLib.instancer",
            str(source),
            f"wght={weight}",
            f"--output={output}",
        )
        return output
    return source


def main() -> None:
    if shutil.which("pyftsubset") is None:
        print("Missing fonttools. Run: pip install fonttools brotli", file=sys.stderr)
        raise SystemExit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    core = set(CORE)
    extended = (LATIN | site_characters()) - core
    all_chars = core | extended
    text = "".join(chr(cp) for cp in sorted(all_chars))

    print(f"Core glyphs: {len(core)}  Extended glyphs requested: {len(extended)}")
    print(f"Features kept: {KEPT_FEATURES}; all other OpenType features and hinting dropped\n")

    rows: list[tuple[str, str, int, str, int, int]] = []

    with tempfile.TemporaryDirectory(prefix="fonts-") as tmp_name:
        tmp = Path(tmp_name)
        for family in FAMILIES:
            request = family["request"]
            weights = family["weights"] or [None]
            for weight in weights:
                label = f"{family['family']} {weight}" if weight else family["family"]
                upstream = tmp / f"{family['id']}-{weight or 'var'}-upstream.woff2"
                upstream.write_bytes(fetch_font(request.format(weight=weight), text))
                prepared = instance(
                    upstream,
                    family["clamp"],
                    weight,
                    tmp / f"{family['id']}-{weight or 'var'}-instanced.woff2",
                )
                source_points = cmap_codepoints(prepared)
                expected_core = core & source_points
                expected_ext = extended & source_points
                if expected_core & expected_ext:
                    raise RuntimeError("core/extended overlap")

                stem = family["id"] if weight is None else f"{family['id']}-{weight}"
                outputs = []
                for kind, points in (("core", expected_core), ("ext", expected_ext)):
                    out = OUT_DIR / f"{stem}-{kind}-{VERSION}.woff2"
                    subset(prepared, points, out)
                    actual = cmap_codepoints(out)
                    if actual != points:
                        raise RuntimeError(
                            f"{out.name}: coverage mismatch (+{sorted(actual - points)}, "
                            f"-{sorted(points - actual)})"
                        )
                    outputs.append((out, len(actual)))
                axis_label = axes(prepared)

                for out, glyphs in outputs:
                    rows.append(
                        (
                            label,
                            out.name,
                            glyphs,
                            axis_label,
                            family["baseline"],
                            out.stat().st_size,
                        )
                    )

    print(f"{'Font':22} {'File':40} {'Glyphs':>6} {'Axes':>12} {'Before':>7} {'After':>6}")
    for label, name, glyphs, axis_label, before, after in rows:
        print(f"{label:22} {name:40} {glyphs:6} {axis_label:>12} {before:7} {after:6}")


if __name__ == "__main__":
    main()
