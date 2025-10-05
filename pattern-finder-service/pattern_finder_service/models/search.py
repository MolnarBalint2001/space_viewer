from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional, Tuple

from pydantic import Field

from .base import CamelModel
from .datasets import DatasetFileStatus


class AssetPreference(str, Enum):
    AUTO = "auto"
    MBTILES = "mbtiles"
    ORIGINAL = "original"


class LinePoint(CamelModel):
    x: float
    y: float

    def as_tuple(self) -> Tuple[float, float]:
        return (self.x, self.y)


class StarDetectionParams(CamelModel):
    min_sigma: float = Field(default=1.0, ge=0.1, description="Minimum sigma for LoG detector")
    max_sigma: float = Field(default=4.0, ge=0.1, description="Maximum sigma for LoG detector")
    num_sigma: int = Field(default=10, ge=1, description="Number of sigma steps")
    threshold: float = Field(default=0.02, ge=0.0, description="Detector intensity threshold")
    log_scale: bool = Field(default=False, description="Use logarithmic scale between sigmas")


class SearchDatasetRequest(CamelModel):
    line_points: List[LinePoint] = Field(alias="linePoints")
    dataset_file_ids: Optional[List[str]] = Field(default=None, alias="datasetFileIds")
    pattern_name: str = Field(default="pattern", alias="patternName", max_length=120)
    star_params: Optional[StarDetectionParams] = Field(default=None, alias="starParams")
    verify_tol_px: float = Field(default=3.0, alias="verifyTolPx", ge=0.1)
    score_threshold: float = Field(default=0.05, alias="scoreThreshold", ge=0.0)
    generate_previews: bool = Field(default=True, alias="generatePreviews")
    asset_preference: AssetPreference = Field(default=AssetPreference.AUTO, alias="assetPreference")


class SearchResultItem(CamelModel):
    dataset_file_id: str = Field(alias="datasetFileId")
    dataset_file_name: str = Field(alias="datasetFileName")
    asset_kind: str = Field(alias="assetKind")
    success: bool
    score: float
    score_above_threshold: bool = Field(alias="scoreAboveThreshold")
    transform: Optional[List[List[float]]] = None
    matched_points_image: Optional[List[List[float]]] = Field(default=None, alias="matchedPointsImage")
    preview_path: Optional[str] = Field(default=None, alias="previewPath")
    preview_url: Optional[str] = Field(default=None, alias="previewUrl")
    stars_path: Optional[str] = Field(default=None, alias="starsPath")
    stars_url: Optional[str] = Field(default=None, alias="starsUrl")
    geojson: Optional[dict] = None
    message: Optional[str] = None


class SearchRunResponse(CamelModel):
    run_id: str = Field(alias="runId")
    dataset_id: str = Field(alias="datasetId")
    dataset_name: str = Field(alias="datasetName")
    pattern_name: str = Field(alias="patternName")
    line_points: List[LinePoint] = Field(alias="linePoints")
    star_params: Optional[StarDetectionParams] = Field(default=None, alias="starParams")
    verify_tol_px: float = Field(alias="verifyTolPx")
    score_threshold: float = Field(alias="scoreThreshold")
    asset_preference: AssetPreference = Field(alias="assetPreference")
    requested_file_ids: Optional[List[str]] = Field(default=None, alias="requestedFileIds")
    used_file_ids: List[str] = Field(default_factory=list, alias="usedFileIds")
    results: List[SearchResultItem]
    success_count: int = Field(alias="successCount")
    total_files: int = Field(alias="totalFiles")
    duration_ms: float = Field(alias="durationMs")
    created_at: datetime = Field(alias="createdAt")


__all__ = [
    "AssetPreference",
    "LinePoint",
    "SearchDatasetRequest",
    "SearchResultItem",
    "SearchRunResponse",
    "StarDetectionParams",
    "DatasetFileStatus",
]
