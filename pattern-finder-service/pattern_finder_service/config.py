from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Tuple


def _parse_max_download_bytes(raw: Optional[str]) -> Optional[int]:
    if raw is None:
        return None
    try:
        value = float(raw)
    except ValueError:
        return None
    if value <= 0:
        return None
    return int(value * 1024 * 1024)


def _parse_cors_origins(raw: Optional[str]) -> Tuple[str, ...]:
    if not raw:
        return tuple()
    items = [item.strip() for item in raw.split(",")]
    return tuple(item for item in items if item)


@dataclass
class ServiceConfig:
    server_base_url: str = field(default_factory=lambda: os.getenv("SERVER_API_BASE_URL", "http://localhost:3000/api"))
    request_timeout: float = field(default_factory=lambda: float(os.getenv("SERVER_REQUEST_TIMEOUT", "30")))
    max_download_bytes: Optional[int] = field(default_factory=lambda: _parse_max_download_bytes(os.getenv("PATTERN_MAX_DOWNLOAD_MB")))
    results_dir: Path = field(default_factory=lambda: Path(os.getenv("PATTERN_RESULTS_DIR", "pattern_outputs")).resolve())
    cors_origins: Tuple[str, ...] = field(default_factory=lambda: _parse_cors_origins(os.getenv("PATTERN_CORS_ORIGINS")))
    gdal_translate_timeout: float = field(default_factory=lambda: float(os.getenv("PATTERN_GDAL_TIMEOUT", "600")))
    superpoint_onnx_path: Optional[Path] = None

    def __post_init__(self) -> None:
        self.server_base_url = self.server_base_url.rstrip("/")
        if self.request_timeout <= 0:
            self.request_timeout = 30.0
        self.results_dir.mkdir(parents=True, exist_ok=True)
        # Default SuperPoint path: <repo-root>/pattern-finder-service/models/superpoint_lightglue_pipeline.onnx
        try:
            base = Path(__file__).resolve().parents[1]
            default_model = base / "models" / "superpoint_lightglue_pipeline.onnx"
            if self.superpoint_onnx_path is None and default_model.exists():
                self.superpoint_onnx_path = default_model
        except Exception:
            # leave as None
            pass


_CONFIG: Optional[ServiceConfig] = None


def get_config() -> ServiceConfig:
    global _CONFIG
    if _CONFIG is None:
        _CONFIG = ServiceConfig()
    return _CONFIG


__all__ = ["ServiceConfig", "get_config"]
