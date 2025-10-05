from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, Union
import itertools

import cv2
import numpy as np
import rasterio
from rasterio.transform import Affine
from scipy.spatial import KDTree
from skimage.exposure import equalize_adapthist
from skimage.feature import blob_log

try:  # Optional helpers for parsing string based line strings
    from shapely.geometry import LineString  # type: ignore
    from shapely import wkt as shapely_wkt  # type: ignore
except Exception:  # pragma: no cover - shapely is optional at runtime
    LineString = None
    shapely_wkt = None


logger = logging.getLogger(__name__)


@dataclass
class StarDetectionParams:
    """Tweaks for the LoG based star detection pipeline."""

    min_sigma: float = 1.0
    max_sigma: float = 4.5
    num_sigma: int = 15
    threshold: float = 0.002
    log_scale: bool = True
    min_prominence: float = 0.08
    min_center_value: float = 0.14
    axis_ratio_limit: float = 0.1
    tolerance_px: float = 500.5


@dataclass
class PatternMatch:
    """Single match between detected stars and the requested shape."""

    anchor_index: int
    matched_indices: List[int]
    points: np.ndarray
    score: float


@dataclass
class PatternFinderResult:
    """Summary of a pattern search run."""

    stars: np.ndarray
    pattern_pixels: np.ndarray
    matches: List[PatternMatch]
    debug_image_path: Optional[Path]


@dataclass
class Pattern:
    """Pattern definition in pixel space (x, y order)."""

    points: np.ndarray
    name: Optional[str] = None

    def __post_init__(self) -> None:
        if self.points.ndim != 2 or self.points.shape[1] != 2:
            raise ValueError("Pattern points array must have shape (N, 2)")
        self.points = self.points.astype(np.float32)

    @property
    def points_rc(self) -> np.ndarray:
        return np.column_stack([self.points[:, 1], self.points[:, 0]]).astype(np.float32)


@dataclass
class MatchResult:
    success: bool
    score: float
    transform: Optional[np.ndarray]
    matched_points_img: Optional[np.ndarray]
    matches: List[PatternMatch] = field(default_factory=list)
    stars_xy: Optional[np.ndarray] = None
    image_path: Optional[str] = None

    def best_match(self) -> Optional[PatternMatch]:
        return self.matches[0] if self.matches else None


def load_tif_grayscale(path: Union[str, Path]) -> Tuple[np.ndarray, Affine]:
    """Load a TIFF/GeoTIFF image and return a normalized grayscale array plus the affine transform."""

    path = Path(path)
    with rasterio.open(path) as src:
        data = src.read(out_dtype=np.float32)
        transform = src.transform

    if data.ndim == 3:
        if data.shape[0] == 1:
            gray = data[0]
        else:
            gray = np.mean(data, axis=0)
    else:
        gray = data.astype(np.float32)

    gray -= float(np.min(gray))
    peak = float(np.max(gray))
    if peak > 0:
        gray /= peak
    return gray, transform


def _parse_linestring(pattern: Union[str, Sequence[Tuple[float, float]], np.ndarray]) -> np.ndarray:
    """Convert user supplied pattern data into an array of lon/lat pairs."""

    if isinstance(pattern, np.ndarray):
        if pattern.ndim != 2 or pattern.shape[1] != 2:
            raise ValueError("Pattern array must have shape (N, 2)")
        return pattern.astype(np.float64)

    if isinstance(pattern, str):
        text = pattern.strip()
        upper = text.upper()
        if LineString is not None and (upper.startswith("LINESTRING") or upper.startswith("MULTILINESTRING")):
            geom = shapely_wkt.loads(text)
            if isinstance(geom, LineString):
                coords = np.asarray(geom.coords, dtype=np.float64)
                return coords
            first = list(geom.geoms)[0]
            coords = np.asarray(first.coords, dtype=np.float64)
            return coords
        if upper.startswith("LINESTRING"):
            start = text.find("(")
            end = text.rfind(")")
            if start == -1 or end == -1 or end <= start:
                raise ValueError("Malformed LINESTRING WKT")
            content = text[start + 1 : end]
            pieces = [item.strip() for item in content.split(",") if item.strip()]
            coords: List[Tuple[float, float]] = []
            for piece in pieces:
                parts = piece.replace(",", " ").split()
                if len(parts) != 2:
                    raise ValueError(f"Cannot parse lon/lat pair from '{piece}'")
                lon, lat = map(float, parts)
                coords.append((lon, lat))
            return np.asarray(coords, dtype=np.float64)
        if upper.startswith("MULTILINESTRING"):
            start = text.find("((")
            end = text.rfind(")")
            if start == -1 or end == -1 or end <= start + 1:
                raise ValueError("Malformed MULTILINESTRING WKT")
            inner = text[start + 2 : end]
            first_segment = inner.split(")")[0]
            pieces = [item.strip() for item in first_segment.split(",") if item.strip()]
            coords: List[Tuple[float, float]] = []
            for piece in pieces:
                parts = piece.replace(",", " ").split()
                if len(parts) != 2:
                    raise ValueError(f"Cannot parse lon/lat pair from '{piece}'")
                lon, lat = map(float, parts)
                coords.append((lon, lat))
            return np.asarray(coords, dtype=np.float64)
        # Fallback simple CSV format: "lon lat, lon lat"
        pieces = []
        for pair in text.split(","):
            lon_lat = pair.strip().split()
            if len(lon_lat) != 2:
                raise ValueError(f"Cannot parse lon/lat pair from '{pair}'")
            lon, lat = map(float, lon_lat)
            pieces.append((lon, lat))
        return np.asarray(pieces, dtype=np.float64)

    iterator: Iterable[Tuple[float, float]] = pattern  # type: ignore
    coords = np.asarray(list(iterator), dtype=np.float64)
    if coords.ndim != 2 or coords.shape[1] != 2:
        raise ValueError("Pattern coordinates must be an iterable of (lon, lat) pairs")
    return coords


def linestring_to_pixels(coords: np.ndarray, transform: Affine) -> np.ndarray:
    """Transform lon/lat pairs to image row/column coordinates."""

    inv = ~transform
    pixels = []
    for lon, lat in coords:
        col, row = inv * (lon, lat)
        pixels.append((row, col))
    return np.asarray(pixels, dtype=np.float32)


def _is_candidate_star(
    img: np.ndarray,
    y: float,
    x: float,
    sigma: float,
    params: StarDetectionParams,
) -> bool:
    if sigma <= 0:
        return False

    radius = max(int(3 * sigma), 3)
    cy = int(round(y))
    cx = int(round(x))
    h, w = img.shape
    if cy < 0 or cx < 0 or cy >= h or cx >= w:
        return False

    y0 = max(cy - radius, 0)
    y1 = min(cy + radius + 1, h)
    x0 = max(cx - radius, 0)
    x1 = min(cx + radius + 1, w)
    patch = img[y0:y1, x0:x1]
    py = cy - y0
    px = cx - x0

    if patch.size == 0 or py < 0 or px < 0 or py >= patch.shape[0] or px >= patch.shape[1]:
        return False

    center_val = float(patch[py, px])
    if center_val < params.min_center_value:
        return False

    rr, cc = np.ogrid[: patch.shape[0], : patch.shape[1]]
    dist2 = (rr - py) ** 2 + (cc - px) ** 2
    sigma_sq = sigma**2
    inner_mask = dist2 <= (sigma_sq * 1.2)
    ring_mask = (dist2 >= (sigma_sq * 1.3)) & (dist2 <= (sigma_sq * 2.3))
    bg_mask = (dist2 > (sigma_sq * 3.8)) & (dist2 <= (sigma_sq * 8.0))
    if not ring_mask.any() or not bg_mask.any():
        return False

    halo_mean = float(patch[ring_mask].mean())
    bg_mean = float(patch[bg_mask].mean())

    prominence = center_val - max(halo_mean, bg_mean)
    if prominence < params.min_prominence:
        return False

    if not (halo_mean > bg_mean + 0.03 and halo_mean < center_val - 0.03):
        return False

    high_mask = patch >= (bg_mean + 0.65 * (center_val - bg_mean))
    if not high_mask.any():
        return False

    area = float(high_mask.sum())
    theoretical = np.pi * sigma_sq
    if area < 0.2 * theoretical or area > 2.0 * theoretical:
        return False

    coords = np.column_stack(np.nonzero(high_mask))
    if coords.shape[0] < 5:
        return False
    coords_centered = coords - coords.mean(axis=0, keepdims=True)
    cov = np.cov(coords_centered, rowvar=False)
    eigvals = np.linalg.eigvalsh(cov)
    if eigvals[-1] <= 0:
        return False
    axis_ratio = eigvals[0] / eigvals[-1]
    if axis_ratio < params.axis_ratio_limit:
        return False

    edge_mask = ~(inner_mask | ring_mask | bg_mask)
    edge_values = patch[edge_mask]
    if edge_values.size and float(np.max(edge_values)) > center_val * 0.95:
        return False

    return True


def detect_stars(img: np.ndarray, params: Optional[StarDetectionParams] = None) -> np.ndarray:
    """Detect star-like blobs in the grayscale image."""

    params = params or StarDetectionParams()
    kernel = max(32, int(min(img.shape[:2]) / 8) or 1)
    img_eq = equalize_adapthist(img, clip_limit=0.01, kernel_size=kernel)

    blobs = blob_log(
        img_eq,
        min_sigma=params.min_sigma,
        max_sigma=params.max_sigma,
        num_sigma=params.num_sigma,
        threshold=params.threshold,
        log_scale=params.log_scale,
    )

    if not len(blobs):
        return np.zeros((0, 2), dtype=np.float32)

    filtered: List[Tuple[float, float]] = []
    for y, x, sigma in blobs:
        if _is_candidate_star(img_eq, y, x, sigma, params):
            filtered.append((y, x))

    if not filtered:
        return np.zeros((0, 2), dtype=np.float32)

    return np.asarray(filtered, dtype=np.float32)


import numpy as np
from scipy.spatial import KDTree
from typing import List, Tuple, NamedTuple

# Az eredmény struktúrájának megtartása
class PatternMatch(NamedTuple):
    anchor_index: int
    matched_indices: List[int]
    points: np.ndarray
    score: float

def match_pattern(
    stars: np.ndarray,
    pattern_pixels: np.ndarray,
    tolerance: float,
    max_iterations: int = 1000,
    min_inliers_ratio: float = 0.7,
) -> List[PatternMatch]:
    """
    Finds star groupings that match the provided pattern using a RANSAC-based approach.
    This method is robust against noise and outliers.
    """
    if pattern_pixels.ndim != 2 or pattern_pixels.shape[1] != 2:
        raise ValueError("pattern_pixels must have shape (N, 2)")
    if stars.ndim != 2 or stars.shape[1] != 2:
        raise ValueError("stars must have shape (M, 2)")

    num_pattern_pts = len(pattern_pixels)
    num_stars = len(stars)

    if num_pattern_pts < 3 or num_stars < num_pattern_pts:
        return []

    # Helper function to find similarity transform from 2 point pairs
    def _find_similarity_transform(src_pts: np.ndarray, dst_pts: np.ndarray) -> np.ndarray:
        """Calculates the similarity transform (scale, rotation, translation) M."""
        # src_pts * M -> dst_pts
        src_mean = np.mean(src_pts, axis=0)
        dst_mean = np.mean(dst_pts, axis=0)
        
        src_centered = src_pts - src_mean
        dst_centered = dst_pts - dst_mean
        
        H = src_centered.T @ dst_centered
        U, _, Vt = np.linalg.svd(H)
        R = Vt.T @ U.T
        
        # Ensure it's a rotation matrix (no reflection)
        if np.linalg.det(R) < 0:
            Vt[-1, :] *= -1
            R = Vt.T @ U.T

        # Calculate scale
        scale = np.sum(np.sqrt(np.sum(dst_centered**2, axis=1))) / np.sum(np.sqrt(np.sum(src_centered**2, axis=1)))
        
        A = scale * R
        t = dst_mean - A @ src_mean
        
        # Create 2x3 affine matrix
        return np.hstack([A, t.reshape(2, 1)])

    # Helper to apply the transform
    def _apply_transform(M: np.ndarray, pts: np.ndarray) -> np.ndarray:
        """Applies a 2x3 affine matrix to a set of points."""
        return (M[:, :2] @ pts.T + M[:, [2]]).T

    # --- RANSAC Main Logic ---
    best_match_info = {'inlier_indices': [], 'transform': None, 'num_inliers': -1}
    
    # Use a KD-Tree for efficient nearest neighbor searches
    star_tree = KDTree(stars)

    min_required_inliers = int(num_pattern_pts * min_inliers_ratio)

    for _ in range(max_iterations):
        # 1. Randomly sample 2 points from pattern and stars
        # Ensures we don't pick the same point twice
        pattern_sample_indices = np.random.choice(num_pattern_pts, 2, replace=False)
        star_sample_indices = np.random.choice(num_stars, 2, replace=False)

        src_sample = pattern_pixels[pattern_sample_indices]
        dst_sample = stars[star_sample_indices]

        # Avoid degenerate samples (points are too close)
        if np.linalg.norm(src_sample[0] - src_sample[1]) < 1e-6 or \
           np.linalg.norm(dst_sample[0] - dst_sample[1]) < 1e-6:
            continue

        # 2. Compute hypothetical transform
        M_hypo = _find_similarity_transform(src_sample, dst_sample)
        
        # 3. Verify: project all pattern points and count inliers
        projected_pattern = _apply_transform(M_hypo, pattern_pixels)
        
        # Find nearest stars to the projected points
        distances, nearest_star_indices = star_tree.query(projected_pattern, k=1)
        
        # Identify inliers based on tolerance
        inlier_mask = distances < tolerance
        current_num_inliers = np.sum(inlier_mask)

        # 4. Keep track of the best model
        if current_num_inliers > best_match_info['num_inliers']:
            # Find the global indices of the inlier stars
            inlier_pattern_indices = np.where(inlier_mask)[0]
            inlier_star_indices = nearest_star_indices[inlier_mask]

            best_match_info = {
                'inlier_indices': list(zip(inlier_pattern_indices, inlier_star_indices)),
                'transform': M_hypo,
                'num_inliers': current_num_inliers
            }
        
        # Early exit if we found a perfect match
        if current_num_inliers == num_pattern_pts:
            break
            
    # --- Post-RANSAC Refinement ---
    if best_match_info['num_inliers'] < min_required_inliers:
        return [] # No good match found

    # 5. Refine the model using ALL inliers from the best hypothesis
    inlier_pairs = np.array(best_match_info['inlier_indices'])
    final_src_pts = pattern_pixels[inlier_pairs[:, 0]]
    final_dst_pts = stars[inlier_pairs[:, 1]]
    
    final_transform = _find_similarity_transform(final_src_pts, final_dst_pts)
    
    # Verify the refined model on the entire pattern again
    final_projected = _apply_transform(final_transform, pattern_pixels)
    final_distances, final_indices = star_tree.query(final_projected, k=1)
    
    final_inliers_mask = final_distances < tolerance
    final_score = np.mean(final_inliers_mask) # Score is the inlier ratio

    if final_score < min_inliers_ratio:
        return []
    
    # Build the result
    matched_indices = final_indices[final_inliers_mask].tolist()
    points = stars[matched_indices]
    
    # We can choose the first matched point as the "anchor"
    anchor_index = matched_indices[0] if matched_indices else -1
    
    match = PatternMatch(
        anchor_index=anchor_index,
        matched_indices=matched_indices,
        points=points,
        score=final_score
    )
    
    # This implementation finds the single best match.
    # To find multiple, non-overlapping matches, you would wrap this in a loop
    # and remove the found stars from the 'stars' array on each iteration.
    return [match]


def _prepare_debug_canvas(img: np.ndarray) -> np.ndarray:
    """Convert grayscale 0-1 image into an 8-bit three channel canvas."""

    if img.ndim != 2:
        raise ValueError("Expected grayscale image")
    scaled = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
    scaled = scaled.astype(np.uint8)
    return cv2.cvtColor(scaled, cv2.COLOR_GRAY2BGR)


def draw_debug_image(
    img: np.ndarray,
    pattern_pixels: np.ndarray,
    stars: np.ndarray,
    matches: Sequence[PatternMatch],
    *,
    output: Optional[Union[str, Path]] = None,
) -> np.ndarray:
    """Draw pattern, detected stars, and matches over the image for visual debugging."""

    canvas = _prepare_debug_canvas(img)

    if len(pattern_pixels):
        pts = [(float(col), float(row)) for row, col in pattern_pixels]
        pts_int = np.asarray(pts, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(canvas, [pts_int], isClosed=False, color=(0, 0, 255), thickness=24)

    for row, col in stars:
        cv2.circle(canvas, (int(round(col)), int(round(row))), 3, (0, 255, 255), 1)

    for match in matches:
        pts = [(float(col), float(row)) for row, col in match.points]
        pts_int = np.asarray(pts, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(canvas, [pts_int], isClosed=False, color=(0, 255, 0), thickness=24)
        anchor = match.points[0]
        cv2.circle(canvas, (int(round(anchor[1])), int(round(anchor[0]))), 4, (0, 165, 255), -1)

    if output is not None:
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), canvas)

    return canvas


def find_pattern_in_image(
    image_path: Union[str, Path],
    pattern: Union[str, Sequence[Tuple[float, float]], np.ndarray],
    *,
    params: Optional[StarDetectionParams] = None,
    debug_output: Optional[Union[str, Path]] = None,
) -> PatternFinderResult:
    """Full pipeline: load image, verify pattern position, detect stars, and match the pattern."""

    params = params or StarDetectionParams()

    try:
        lonlat = _parse_linestring(pattern)
    except Exception as exc:  # pragma: no cover - input validation
        logger.error("Could not parse pattern input: %s", exc)
        raise

    img, transform = load_tif_grayscale(image_path)
    pattern_pixels = linestring_to_pixels(lonlat, transform)

    stars = detect_stars(img, params)
    matches = match_pattern(stars, pattern_pixels, params.tolerance_px) if len(pattern_pixels) else []

    debug_path: Optional[Path] = None
    if debug_output is not None:
        debug_path = Path(debug_output)
        try:
            draw_debug_image(img, pattern_pixels, stars, matches, output=debug_path)
        except Exception:
            logger.exception("Failed to create debug overlay at %s", debug_path)
            debug_path = None
    else:
        draw_debug_image(img, pattern_pixels, stars, matches)

    return PatternFinderResult(
        stars=stars,
        pattern_pixels=pattern_pixels,
        matches=matches,
        debug_image_path=debug_path,
    )


def line_string_to_points(
    data: Union[str, Sequence[Tuple[float, float]], np.ndarray]
) -> np.ndarray:
    if isinstance(data, np.ndarray):
        points = data
    elif isinstance(data, str):
        points = _parse_linestring(data)
    else:
        points = np.asarray(list(data), dtype=np.float32)
    if points.ndim != 2 or points.shape[1] != 2:
        raise ValueError("LineString points must have shape (N, 2)")
    return points.astype(np.float32)


def build_pattern(points: Union[np.ndarray, Sequence[Tuple[float, float]]], name: Optional[str] = None) -> Pattern:
    array = line_string_to_points(points)
    return Pattern(points=array, name=name)


def load_tif_gray(path: Union[str, Path]) -> np.ndarray:
    img, _ = load_tif_grayscale(path)
    return img


def _apply_star_param_overrides(
    params: StarDetectionParams, overrides: Optional[Dict[str, Any]]
) -> StarDetectionParams:
    if not overrides:
        return params
    for key, value in overrides.items():
        if hasattr(params, key):
            setattr(params, key, type(getattr(params, key))(value))
    return params


def search_in_image(
    image_path: Union[str, Path],
    pattern: Pattern,
    star_params: Optional[Dict[str, Any]] = None,
    verify_tol_px: Optional[float] = None,
    *,
    debug_output: Optional[Union[str, Path]] = None,
) -> MatchResult:
    path = Path(image_path)
    img, _ = load_tif_grayscale(path)

    params = StarDetectionParams()
    params = _apply_star_param_overrides(params, star_params)
    if verify_tol_px is not None:
        params.tolerance_px = float(verify_tol_px)

    stars_rc = detect_stars(img, params)
    matches = match_pattern(stars_rc, pattern.points_rc, params.tolerance_px)

    best = matches[0] if matches else None
    matched_points_xy: Optional[np.ndarray] = None
    transform: Optional[np.ndarray] = None
    score = float(best.score) if best else 0.0

    if best is not None:
        matched_points_xy = np.column_stack([best.points[:, 1], best.points[:, 0]]).astype(np.float32)
        if pattern.points.shape[0] >= 2 and matched_points_xy.shape[0] >= 2:
            matrix, _ = cv2.estimateAffinePartial2D(
                pattern.points.astype(np.float32),
                matched_points_xy,
                method=cv2.LMEDS,
            )
            if matrix is not None:
                transform = matrix.astype(np.float32)

    stars_xy = (
        np.column_stack([stars_rc[:, 1], stars_rc[:, 0]]).astype(np.float32)
        if len(stars_rc)
        else None
    )

    if debug_output is not None:
        debug_path = Path(debug_output)
        draw_debug_image(img, pattern.points_rc, stars_rc, matches, output=debug_path)

    return MatchResult(
        success=best is not None,
        score=score,
        transform=transform,
        matched_points_img=matched_points_xy,
        matches=matches,
        stars_xy=stars_xy,
        image_path=str(path),
    )


def visualize_match(
    image_path: Union[str, Path],
    pattern: Pattern,
    match_result: MatchResult,
    out_dir: Union[str, Path],
    *,
    filename: Optional[str] = None,
) -> str:
    base = Path(image_path)
    out_directory = Path(out_dir)
    out_directory.mkdir(parents=True, exist_ok=True)

    img, _ = load_tif_grayscale(base)
    stars_rc = (
        np.column_stack([match_result.stars_xy[:, 1], match_result.stars_xy[:, 0]]).astype(np.float32)
        if match_result.stars_xy is not None and len(match_result.stars_xy)
        else np.zeros((0, 2), dtype=np.float32)
    )

    matches = match_result.matches
    best = match_result.best_match()
    if best is not None:
        matches = [best]

    output_name = filename or f"{base.stem}_match.png"
    output_path = out_directory / output_name
    draw_debug_image(img, pattern.points_rc, stars_rc, matches, output=output_path)
    return str(output_path)


def visualize_stars(
    image_path: Union[str, Path],
    stars_xy: Optional[np.ndarray],
    out_dir: Union[str, Path],
    *,
    projected_pattern: Optional[np.ndarray] = None,
    matched_points: Optional[np.ndarray] = None,
    filename: Optional[str] = None,
) -> str:
    base = Path(image_path)
    out_directory = Path(out_dir)
    out_directory.mkdir(parents=True, exist_ok=True)

    img, _ = load_tif_grayscale(base)
    canvas = _prepare_debug_canvas(img)

    if stars_xy is not None and len(stars_xy):
        for x, y in stars_xy:
            cv2.circle(canvas, (int(round(x)), int(round(y))), 3, (0, 255, 255), 1)

    if projected_pattern is not None and len(projected_pattern) >= 2:
        pts = np.asarray(projected_pattern, dtype=np.float32)
        pts_int = pts.reshape((-1, 1, 2)).astype(np.int32)
        cv2.polylines(canvas, [pts_int], isClosed=False, color=(0, 0, 255), thickness=2)

    if matched_points is not None and len(matched_points):
        pts = np.asarray(matched_points, dtype=np.float32)
        pts_int = pts.reshape((-1, 1, 2)).astype(np.int32)
        cv2.polylines(canvas, [pts_int], isClosed=False, color=(0, 255, 0), thickness=2)
        for x, y in pts:
            cv2.circle(canvas, (int(round(x)), int(round(y))), 8, (0, 165, 255), -1)

    output_name = filename or f"{base.stem}_stars.png"
    output_path = out_directory / output_name
    cv2.imwrite(str(output_path), canvas)
    return str(output_path)


__all__ = [
    "StarDetectionParams",
    "PatternMatch",
    "PatternFinderResult",
    "Pattern",
    "MatchResult",
    "load_tif_grayscale",
    "load_tif_gray",
    "linestring_to_pixels",
    "line_string_to_points",
    "build_pattern",
    "detect_stars",
    "match_pattern",
    "draw_debug_image",
    "find_pattern_in_image",
    "search_in_image",
    "visualize_match",
    "visualize_stars",
]
