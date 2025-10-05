from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

from .. import logger
from ..config import ServiceConfig
from ..models import DatasetDetailModel, DatasetSummaryModel


class DatasetServerClient:
    def __init__(self, config: ServiceConfig) -> None:
        self._config = config

    async def _request_json(
        self,
        method: str,
        path: str,
        *,
        headers: Optional[Dict[str, str]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        url = f"{self._config.server_base_url}{path}"
        request_headers = headers or None
        try:
            async with httpx.AsyncClient(timeout=self._config.request_timeout, follow_redirects=True) as client:
                response = await client.request(method, url, headers=request_headers, **kwargs)
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Dataset server returned error",
                {
                    "method": method,
                    "url": url,
                    "status": exc.response.status_code,
                    "text": exc.response.text[:500],
                },
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Dataset server request failed ({exc.response.status_code}).",
            ) from exc
        except httpx.HTTPError as exc:
            logger.error(
                "Dataset server HTTP error",
                {"method": method, "url": url, "error": str(exc)},
            )
            raise HTTPException(status_code=502, detail="Dataset server is unavailable.") from exc
        try:
            return response.json()
        except ValueError as exc:
            logger.error("Dataset server returned invalid JSON", {"method": method, "url": url})
            raise HTTPException(status_code=502, detail="Dataset server returned invalid JSON.") from exc

    async def _stream_to_file(
        self,
        method: str,
        path: str,
        destination: Path,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> int:
        url = f"{self._config.server_base_url}{path}"
        total_bytes = 0
        async with httpx.AsyncClient(timeout=self._config.request_timeout, follow_redirects=True) as client:
            async with client.stream(method, url, headers=headers) as response:
                response.raise_for_status()
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("wb") as fh:
                    async for chunk in response.aiter_bytes():
                        total_bytes += len(chunk)
                        fh.write(chunk)
        return total_bytes

    async def list_public_datasets(
        self,
        search: Optional[str],
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> List[DatasetSummaryModel]:
        params = {"search": search} if search else None
        payload = await self._request_json("GET", "/datasets/public", params=params, headers=headers)
        items = payload.get("items", [])
        return [DatasetSummaryModel(**item) for item in items]

    async def get_public_dataset(
        self,
        dataset_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> DatasetDetailModel:
        payload = await self._request_json("GET", f"/datasets/public/{dataset_id}", headers=headers)
        return DatasetDetailModel(**payload)

    async def get_public_file_download_url(
        self,
        dataset_id: str,
        file_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> str:
        payload = await self._request_json(
            "GET",
            f"/datasets/public/{dataset_id}/files/{file_id}/download",
            headers=headers,
        )
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=502, detail="Dataset server response lacked a download URL.")
        return url

    async def get_public_mbtiles_url(
        self,
        dataset_id: str,
        file_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> str:
        payload = await self._request_json(
            "GET",
            f"/datasets/public/{dataset_id}/files/{file_id}/mbtiles",
            headers=headers,
        )
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=502, detail="Dataset server response lacked an MBTiles URL.")
        return url

    async def get_admin_dataset(
        self,
        dataset_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> DatasetDetailModel:
        payload = await self._request_json("GET", f"/admin/datasets/{dataset_id}", headers=headers)
        return DatasetDetailModel(**payload)

    async def get_admin_file_download_url(
        self,
        dataset_id: str,
        file_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> str:
        payload = await self._request_json(
            "GET",
            f"/admin/datasets/{dataset_id}/files/{file_id}/download",
            headers=headers,
        )
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=502, detail="Dataset server response lacked a download URL.")
        return url

    async def get_admin_mbtiles_url(
        self,
        dataset_id: str,
        file_id: str,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> str:
        payload = await self._request_json(
            "GET",
            f"/admin/datasets/{dataset_id}/files/{file_id}/mbtiles",
            headers=headers,
        )
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=502, detail="Dataset server response lacked an MBTiles URL.")
        return url

    async def persist_pattern_search_run(
        self,
        run_payload: Dict[str, Any],
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        try:
            await self._request_json(
                "POST",
                "/pattern-search/runs",
                json=run_payload,
                headers=headers,
            )
        except HTTPException as exc:
            logger.warning(
                "Failed to persist pattern search run",
                {"status": exc.status_code, "detail": exc.detail},
            )
        except Exception:
            logger.exception("Unexpected error while persisting pattern search run")

    async def download_admin_file(
        self,
        dataset_id: str,
        file_id: str,
        destination: Path,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> int:
        return await self._stream_to_file(
            "GET",
            f"/admin/datasets/{dataset_id}/files/{file_id}/raw",
            destination,
            headers=headers,
        )

    async def download_admin_mbtiles(
        self,
        dataset_id: str,
        file_id: str,
        destination: Path,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> int:
        return await self._stream_to_file(
            "GET",
            f"/admin/datasets/{dataset_id}/files/{file_id}/mbtiles/raw",
            destination,
            headers=headers,
        )

    async def download_public_file(
        self,
        dataset_id: str,
        file_id: str,
        destination: Path,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> int:
        return await self._stream_to_file(
            "GET",
            f"/datasets/public/{dataset_id}/files/{file_id}/raw",
            destination,
            headers=headers,
        )

    async def download_public_mbtiles(
        self,
        dataset_id: str,
        file_id: str,
        destination: Path,
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> int:
        return await self._stream_to_file(
            "GET",
            f"/datasets/public/{dataset_id}/files/{file_id}/mbtiles/raw",
            destination,
            headers=headers,
        )


__all__ = ["DatasetServerClient"]
