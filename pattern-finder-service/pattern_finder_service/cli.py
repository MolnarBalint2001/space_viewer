from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable, Tuple

from .services.pattern_core import (
    build_pattern,
    line_string_to_points,
    search_in_image,
    visualize_match,
)


def _parse_line_points(raw: str) -> Iterable[Tuple[float, float]]:
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("LineString must be a list of point pairs.")
    return [tuple(map(float, point)) for point in data]


def main() -> None:
    parser = argparse.ArgumentParser(description="Csillag minta kereső TIFF képeken")
    parser.add_argument("--refs", type=str, nargs="+", required=True, help="TIFF/GeoTIFF files to search in")
    parser.add_argument("--line", type=str, required=True, help="LineString points JSON: [[x1,y1],[x2,y2],...]")
    parser.add_argument("--out", type=str, default="outputs", help="Output directory")
    parser.add_argument("--min_sigma", type=float, default=1.0)
    parser.add_argument("--max_sigma", type=float, default=4.0)
    parser.add_argument("--threshold", type=float, default=0.02)
    parser.add_argument("--verify_tol", type=float, default=3.0)
    parser.add_argument("--score_thr", type=float, default=0.07)
    args = parser.parse_args()

    line_coords = _parse_line_points(args.line)
    pattern = build_pattern(line_string_to_points(line_coords))
    star_params = dict(min_sigma=args.min_sigma, max_sigma=args.max_sigma, threshold=args.threshold)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    summary = []
    for path in args.refs:
        res = search_in_image(path, pattern, star_params=star_params, verify_tol_px=args.verify_tol)
        if res.success and res.score >= args.score_thr:
            preview = visualize_match(path, pattern, res, out_dir=str(out_dir))
        else:
            preview = None
        summary.append(
            {
                "image": path,
                "success": res.success,
                "score": res.score,
                "transform": res.transform.tolist() if res.transform is not None else None,
                "preview_png": preview,
            }
        )

    out_json = out_dir / "results.json"
    with out_json.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Eredmények mentve: {out_json}")


if __name__ == "__main__":  # pragma: no cover
    main()
