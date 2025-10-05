from __future__ import annotations

import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import os
import numpy as np
import rasterio
from rasterio.warp import transform as rio_transform
from rasterio.transform import rowcol

from fastapi import HTTPException

from .. import logger
from ..config import ServiceConfig, get_config
from ..models import (
    AssetPreference,
    DatasetDetailModel,
    DatasetFileModel,
    SearchDatasetRequest,
    SearchResultItem,
)
from ..services.pattern_core import (
    MatchResult,
    Pattern,
    build_pattern,
    line_string_to_points,
    search_in_image,
    visualize_match,
    visualize_stars,
)
from ..clients.dataset_server import DatasetServerClient


def sanitize_filename(name: str) -> str:
    safe = [ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in name]
    sanitized = "".join(safe).strip("._")
    return sanitized or "file"


def _project_pattern_points(pattern: Pattern, match_result: MatchResult) -> Optional[np.ndarray]:
    if match_result.transform is None:
        return None
    pts = pattern.points.astype(np.float64)
    M = match_result.transform.astype(np.float64)
    projected = (M[:, :2] @ pts.T + M[:, [2]]).T
    return projected


def _line_points_to_pixels(
    ds: rasterio.io.DatasetReader,
    points: List[Tuple[float, float]],
) -> Optional[np.ndarray]:
    """Convert line points to pixel space.
    Heuristic: if points look like lon/lat (ranges within [-180,180]x[-90,90]),
    transform to dataset CRS, then to row/col. Otherwise assume pixel coords.
    Returns Nx2 array in (x, y) pixel order.
    """
    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    # Lon/lat heuristic
    looks_geo = (
        -180.0 <= minx <= 180.0 and -180.0 <= maxx <= 180.0 and
        -90.0 <= miny <= 90.0 and -90.0 <= maxy <= 90.0
    )
    if looks_geo and ds.crs:
        try:
            # transform lon/lat -> dataset CRS
            gx, gy = rio_transform("EPSG:4326", ds.crs, xs, ys)
        except Exception:
            gx, gy = xs, ys
        # dataset row/col from geo coords
        rows, cols = rowcol(ds.transform, gx, gy, op=float)
        # rowcol returns tuples; cast to arrays
        px = np.array(cols, dtype=np.float32)
        py = np.array(rows, dtype=np.float32)
        return np.column_stack([px, py])
    else:
        # Already pixel space (assumption). Ensure float32 and (x,y)
        arr = np.array(points, dtype=np.float32)
        return arr


def _pixel_points_to_lonlat(
    ds: rasterio.io.DatasetReader,
    pixel_points: np.ndarray,
) -> Optional[List[List[float]]]:
    if pixel_points.size == 0:
        return None

    crs = ds.crs
    need_transform = bool(crs and crs.is_valid and not crs.is_geographic)

    cols = pixel_points[:, 0].astype(float)
    rows = pixel_points[:, 1].astype(float)

    xs: List[float] = []
    ys: List[float] = []
    for row, col in zip(rows, cols):
        gx, gy = ds.xy(row, col, offset="center")
        xs.append(gx)
        ys.append(gy)

    if need_transform:
        lon_arr, lat_arr = rio_transform(crs, "EPSG:4326", xs, ys)
        xs, ys = lon_arr, lat_arr

    coords: List[List[float]] = []
    for lon, lat in zip(xs, ys):
        coords.append([float(lon), float(lat)])

    return coords


def build_match_geojson(search_path: Path, pattern: Pattern, match_result: MatchResult) -> Optional[Dict[str, Any]]:
    if match_result.matched_points_img is not None and len(match_result.matched_points_img) >= 2:
        pixel_pts = match_result.matched_points_img
    else:
        projected = _project_pattern_points(pattern, match_result)
        pixel_pts = projected if projected is not None else None

    if pixel_pts is None or pixel_pts.shape[0] < 2:
        return None

    try:
        with rasterio.open(str(search_path)) as dataset:
            coords = _pixel_points_to_lonlat(dataset, pixel_pts)
    except Exception as exc:
        logger.exception(
            "Failed to construct geojson for match",
            {
                "path": str(search_path),
                "dataset_id": getattr(match_result, "image_path", "unknown"),
                "error": str(exc),
            },
        )
        return None

    if coords is None or len(coords) < 2:
        return None

    polygon_coords = coords + [coords[0]]

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "kind": "pattern-line",
                    "score": float(match_result.score),
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords,
                },
            },
            {
                "type": "Feature",
                "properties": {
                    "kind": "pattern-polygon",
                    "score": float(match_result.score),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon_coords],
                },
            },
        ],
    }


def resolve_asset_source(
    file: DatasetFileModel,
    preference: AssetPreference,
) -> Tuple[str, bool]:
    if preference == AssetPreference.MBTILES:
        order = ["mbtiles", "original"]
    elif preference == AssetPreference.ORIGINAL:
        order = ["original", "mbtiles"]
    else:
        order = ["mbtiles", "original"]

    for index, kind in enumerate(order):
        if kind == "mbtiles":
            if not file.mbtiles_key:
                continue
            return kind, index > 0
        return kind, index > 0
    raise HTTPException(status_code=404, detail=f"No downloadable assets available for dataset file {file.id}.")


async def download_dataset_asset(
    client: DatasetServerClient,
    dataset_id: str,
    file: DatasetFileModel,
    asset_kind: str,
    destination: Path,
    *,
    headers: Optional[Dict[str, str]] = None,
    use_admin_endpoints: bool,
) -> int:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        if asset_kind == "mbtiles":
            if use_admin_endpoints:
                return await client.download_admin_mbtiles(dataset_id, file.id, destination, headers=headers)
            return await client.download_public_mbtiles(dataset_id, file.id, destination, headers=headers)
        if use_admin_endpoints:
            return await client.download_admin_file(dataset_id, file.id, destination, headers=headers)
        return await client.download_public_file(dataset_id, file.id, destination, headers=headers)
    except HTTPException:
        if destination.exists():
            destination.unlink(missing_ok=True)
        raise


async def convert_mbtiles_to_geotiff(mbtiles_path: Path) -> Path:
    tif_path = mbtiles_path.with_suffix(".tif")
    if tif_path.exists():
        tif_path.unlink()
    command = [
        "gdal_translate",
        "--config",
        "GDAL_NUM_THREADS",
        "ALL_CPUS",
        "-co",
        "NUM_THREADS=ALL_CPUS",
        "-of",
        "GTiff",
        str(mbtiles_path),
        str(tif_path),
    ]
    logger.info(
        "Converting MBTiles to GeoTIFF command=%s source=%s target=%s",
        " ".join(command),
        str(mbtiles_path),
        str(tif_path),
    )

    env = os.environ.copy()
    env.setdefault("GDAL_NUM_THREADS", "ALL_CPUS")
    config = get_config()
    timeout = max(5.0, float(config.gdal_translate_timeout))

    def _run() -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            timeout=timeout,
        )

    try:
        completed = await asyncio.to_thread(_run)
        logger.info(completed)
    except subprocess.TimeoutExpired as exc:
        logger.error(
            "gdal_translate timed out after %s seconds command=%s stdout=%s stderr=%s",
            exc.timeout,
            " ".join(command),
            (exc.stdout or "").strip() if isinstance(exc.stdout, str) else "",
            (exc.stderr or "").strip() if isinstance(exc.stderr, str) else "",
        )
        raise HTTPException(status_code=504, detail=f"gdal_translate timed out after {timeout} seconds") from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="gdal_translate command not found. It is required to process MBTiles files.") from exc

    stdout = completed.stdout or ""
    stderr = completed.stderr or ""

    if completed.returncode != 0:
        logger.error(
            "gdal_translate failed rc=%s command=%s stdout=%s stderr=%s",
            completed.returncode,
            " ".join(command),
            stdout.strip(),
            stderr.strip(),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to convert MBTiles to GeoTIFF: "
                f"{(stderr or stdout).strip() or 'Unknown error'}"
            ),
        )

    if stdout:
        logger.info(
            "gdal_translate stdout command=%s output=%s",
            " ".join(command),
            stdout.strip(),
        )
    if stderr:
        logger.info(
            "gdal_translate stderr command=%s output=%s",
            " ".join(command),
            stderr.strip(),
        )

    return tif_path


def _relative_result_path(result_full_path: str, config: ServiceConfig) -> Optional[Path]:
    try:
        return Path(result_full_path).resolve().relative_to(config.results_dir)
    except ValueError:
        return None


async def execute_search(
    run_id: str,
    dataset: DatasetDetailModel,
    files: List[DatasetFileModel],
    payload: SearchDatasetRequest,
    client: DatasetServerClient,
    config: ServiceConfig,
    request_headers: Optional[Dict[str, str]] = None,
    use_admin_endpoints: bool = False,
) -> Tuple[List[SearchResultItem], List[str]]:
    base_points = [point.as_tuple() for point in payload.line_points]
    star_params_dict = payload.star_params.dict(exclude_none=True) if payload.star_params else None

    run_dir = config.results_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    preview_dir = run_dir / "previews"
    preview_dir.mkdir(parents=True, exist_ok=True)
    stars_dir = run_dir / "stars"
    stars_dir.mkdir(parents=True, exist_ok=True)

    results: List[SearchResultItem] = []
    used_file_ids: List[str] = []

    with tempfile.TemporaryDirectory(prefix=f"pattern_{run_id}_") as tmp_root:
        tmp_dir = Path(tmp_root)
        for file in files:
            try:
                asset_kind, fallback_used = resolve_asset_source(
                    file,
                    payload.asset_preference,
                )
            except HTTPException as exc:
                results.append(
                    SearchResultItem(
                        dataset_file_id=file.id,
                        dataset_file_name=file.original_filename,
                        asset_kind="unavailable",
                        success=False,
                        score=0.0,
                        score_above_threshold=False,
                        transform=None,
                        matched_points_image=None,
                        preview_path=None,
                        preview_url=None,
                        stars_path=None,
                        stars_url=None,
                        geojson=None,
                        message=str(exc.detail),
                    )
                )
                continue

            suffix = ".mbtiles" if asset_kind == "mbtiles" else (Path(file.original_filename).suffix or ".tif")
            filename = f"{sanitize_filename(file.id)}{suffix}"
            destination = tmp_dir / filename
            try:
                bytes_downloaded = await download_dataset_asset(
                    client,
                    dataset.id,
                    file,
                    asset_kind,
                    destination,
                    headers=request_headers,
                    use_admin_endpoints=use_admin_endpoints,
                )
                if config.max_download_bytes is not None and bytes_downloaded > config.max_download_bytes:
                    raise HTTPException(status_code=413, detail="Downloaded asset exceeded configured size limit.")
                logger.info(
                    "Downloaded dataset asset",
                    {
                        "dataset_id": dataset.id,
                        "file_id": file.id,
                        "asset_kind": asset_kind,
                        "bytes": bytes_downloaded,
                        "path": str(destination),
                    },
                )
            except HTTPException as exc:
                results.append(
                    SearchResultItem(
                        dataset_file_id=file.id,
                        dataset_file_name=file.original_filename,
                        asset_kind=asset_kind,
                        success=False,
                        score=0.0,
                        score_above_threshold=False,
                        transform=None,
                        matched_points_image=None,
                        preview_path=None,
                        preview_url=None,
                        stars_path=None,
                        stars_url=None,
                        geojson=None,
                        message=str(exc.detail),
                    )
                )
                continue

            search_path = destination
            if asset_kind == "mbtiles":
                try:
                    search_path = await convert_mbtiles_to_geotiff(destination)
                    logger.info(search_path)

                except HTTPException as exc:
                    results.append(
                        SearchResultItem(
                            dataset_file_id=file.id,
                            dataset_file_name=file.original_filename,
                            asset_kind=asset_kind,
                            success=False,
                            score=0.0,
                            score_above_threshold=False,
                            transform=None,
                            matched_points_image=None,
                            preview_path=None,
                            preview_url=None,
                            stars_path=None,
                            stars_url=None,
                            geojson=None,
                            message=str(exc.detail),
                        )
                    )
                    continue

            used_file_ids.append(file.id)
            try:
                # Konvertáljuk a bemeneti vonal pontokat pixel koordinátákra az aktuális raszterben
                with rasterio.open(str(search_path)) as ds_for_pattern:
                    pattern_xy = _line_points_to_pixels(ds_for_pattern, base_points)
                    if pattern_xy is None or pattern_xy.shape[0] < 2:
                        raise HTTPException(status_code=400, detail="Pattern line points conversion failed")
                    pattern = build_pattern(pattern_xy, name=payload.pattern_name)

                match_result: MatchResult = await asyncio.to_thread(
                    search_in_image,
                    str(search_path),
                    pattern,
                    star_params_dict,
                    payload.verify_tol_px,
                )
            except Exception as exc:  # pragma: no cover
                logger.exception(
                    "Pattern search failed",
                    {
                        "dataset_id": dataset.id,
                        "file_id": file.id,
                        "asset_kind": asset_kind,
                    },
                )
                results.append(
                    SearchResultItem(
                        dataset_file_id=file.id,
                        dataset_file_name=file.original_filename,
                        asset_kind=asset_kind,
                        success=False,
                        score=0.0,
                        score_above_threshold=False,
                        transform=None,
                        matched_points_image=None,
                        preview_path=None,
                        preview_url=None,
                        stars_path=None,
                        stars_url=None,
                        geojson=None,
                        message=str(exc),
                    )
                )
                continue

            score_above_threshold = bool(match_result.score >= payload.score_threshold)
            success = bool(match_result.transform is not None and score_above_threshold)
            transform_list = match_result.transform.tolist() if match_result.transform is not None else None
            matched_points = (
                match_result.matched_points_img.tolist() if match_result.matched_points_img is not None else None
            )

            preview_path_str = None
            preview_url = None
            stars_path_str = None
            stars_url = None
            geojson_feature = None
            if success and payload.generate_previews:
                try:
                    preview_full = await asyncio.to_thread(
                        visualize_match,
                        str(search_path),
                        pattern,
                        match_result,
                        str(preview_dir),
                    )
                    rel_path = _relative_result_path(preview_full, config)
                    if rel_path is not None:
                        preview_path_str = rel_path.as_posix()
                        preview_url = f"/results/{preview_path_str}"
                    else:
                        preview_path_str = preview_full
                except Exception as exc:  # pragma: no cover
                    logger.exception(
                        "Failed to generate preview",
                        {
                            "dataset_id": dataset.id,
                            "file_id": file.id,
                            "asset_kind": asset_kind,
                        },
                    )

            if payload.generate_previews and match_result.stars_xy is not None:
                try:
                    projected_pattern = _project_pattern_points(pattern, match_result)
                    stars_full = await asyncio.to_thread(
                        visualize_stars,
                        str(search_path),
                        match_result.stars_xy,
                        str(stars_dir),
                        projected_pattern=projected_pattern,
                        matched_points=match_result.matched_points_img,
                    )
                    rel_path = _relative_result_path(stars_full, config)
                    if rel_path is not None:
                        stars_path_str = rel_path.as_posix()
                        stars_url = f"/results/{stars_path_str}"
                    else:
                        stars_path_str = stars_full
                except Exception:  # pragma: no cover
                    logger.exception(
                        "Failed to generate stars visualization",
                        {
                            "dataset_id": dataset.id,
                            "file_id": file.id,
                            "asset_kind": asset_kind,
                        },
                    )

            if success:
                try:
                    geojson_feature = build_match_geojson(Path(search_path), pattern, match_result)
                except Exception:  # pragma: no cover
                    logger.exception(
                        "Failed to generate match geojson",
                        {
                            "dataset_id": dataset.id,
                            "file_id": file.id,
                            "asset_kind": asset_kind,
                        },
                    )

            message_parts: List[str] = []
            if fallback_used:
                if asset_kind == "mbtiles":
                    message_parts.append("Original file unavailable, MBTiles variant was used.")
                else:
                    message_parts.append("MBTiles variant unavailable, original file was used.")
            if not success:
                message_parts.append("Pattern verification did not meet the success criteria.")

            results.append(
                SearchResultItem(
                    dataset_file_id=file.id,
                    dataset_file_name=file.original_filename,
                    asset_kind=asset_kind,
                    success=success,
                    score=float(match_result.score),
                    score_above_threshold=score_above_threshold,
                    transform=transform_list,
                    matched_points_image=matched_points,
                    preview_path=preview_path_str,
                    preview_url=preview_url,
                    stars_path=stars_path_str,
                    stars_url=stars_url,
                    geojson=geojson_feature,
                    message=" ".join(message_parts) if message_parts else None,
                )
            )

    return results, used_file_ids


__all__ = [
    "convert_mbtiles_to_geotiff",
    "download_dataset_asset",
    "execute_search",
    "resolve_asset_source",
    "sanitize_filename",
]
