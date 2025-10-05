from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import Field, HttpUrl

from .base import CamelModel


class DatasetVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    LINK = "link"


class DatasetStatus(str, Enum):
    EMPTY = "empty"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class DatasetFileStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class DatasetAttachmentModel(CamelModel):
    id: str
    original_filename: str = Field(alias="originalFilename")
    mime_type: str = Field(alias="mimeType")
    size: Optional[int] = Field(default=None)
    download_url: Optional[HttpUrl] = Field(default=None, alias="downloadUrl")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")


class DatasetFileModel(CamelModel):
    id: str
    original_filename: str = Field(alias="originalFilename")
    mime_type: str = Field(alias="mimeType")
    status: DatasetFileStatus
    size: Optional[int] = Field(default=None)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)
    download_url: Optional[HttpUrl] = Field(default=None, alias="downloadUrl")
    mbtiles_key: Optional[str] = Field(default=None, alias="mbtilesKey")
    mbtiles_download_url: Optional[HttpUrl] = Field(default=None, alias="mbtilesDownloadUrl")
    mbtiles_size: Optional[int] = Field(default=None, alias="mbtilesSize")
    tileset_key: Optional[str] = Field(default=None, alias="tilesetKey")
    center_lat: Optional[float] = Field(default=None, alias="centerLat")
    center_lng: Optional[float] = Field(default=None, alias="centerLng")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")
    processed_at: Optional[datetime] = Field(default=None, alias="processedAt")
    error_message: Optional[str] = Field(default=None, alias="errorMessage")


class DatasetSummaryModel(CamelModel):
    id: str
    name: str
    description: Optional[str] = Field(default=None)
    visibility: DatasetVisibility
    status: DatasetStatus
    share_token: Optional[str] = Field(default=None, alias="shareToken")
    ready_at: Optional[datetime] = Field(default=None, alias="readyAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    file_count: int = Field(alias="fileCount")
    attachment_count: int = Field(alias="attachmentCount")


class DatasetDetailModel(DatasetSummaryModel):
    files: List[DatasetFileModel]
    attachments: List[DatasetAttachmentModel]


class DatasetListResponse(CamelModel):
    items: List[DatasetSummaryModel]


__all__ = [
    "DatasetAttachmentModel",
    "DatasetDetailModel",
    "DatasetFileModel",
    "DatasetFileStatus",
    "DatasetListResponse",
    "DatasetStatus",
    "DatasetSummaryModel",
    "DatasetVisibility",
]
