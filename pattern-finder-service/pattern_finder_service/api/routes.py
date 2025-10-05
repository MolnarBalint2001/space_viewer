from __future__ import annotations

import time
import uuid
from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query, Request

import json

from .. import logger
from ..clients.dataset_server import DatasetServerClient
from ..config import ServiceConfig
from ..models import (
    DatasetDetailModel,
    DatasetFileStatus,
    DatasetListResponse,
    SearchDatasetRequest,
    SearchRunResponse,
)
from ..services.pattern_runner import execute_search


def _extract_auth_headers(request: Request) -> Optional[Dict[str, str]]:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        return None
    return {"Authorization": auth_header}


def create_router(config: ServiceConfig, dataset_client: DatasetServerClient) -> APIRouter:
    router = APIRouter()

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @router.get(
        "/datasets/public",
        response_model=DatasetListResponse,
        summary="List public datasets",
    )
    async def list_public_datasets(
        request: Request,
        search: Optional[str] = Query(default=None, description="Optional free-text filter"),
    ) -> DatasetListResponse:
        headers = _extract_auth_headers(request)
        items = await dataset_client.list_public_datasets(search, headers=headers)
        return DatasetListResponse(items=items)

    @router.get(
        "/datasets/public/{dataset_id}",
        response_model=DatasetDetailModel,
        summary="Get public dataset detail",
    )
    async def get_public_dataset(request: Request, dataset_id: str) -> DatasetDetailModel:
        headers = _extract_auth_headers(request)
        return await dataset_client.get_public_dataset(dataset_id, headers=headers)

    @router.post(
        "/datasets/{dataset_id}/search",
        response_model=SearchRunResponse,
        summary="Run the pattern search on dataset files",
    )
    async def run_dataset_search(
        request: Request,
        dataset_id: str,
        payload: SearchDatasetRequest,
    ) -> SearchRunResponse:
        if len(payload.line_points) < 3:
            raise HTTPException(status_code=422, detail="linePoints must contain at least three coordinates.")
        if payload.star_params and payload.star_params.max_sigma < payload.star_params.min_sigma:
            raise HTTPException(status_code=422, detail="starParams.max_sigma must be greater or equal to min_sigma.")

        headers = _extract_auth_headers(request)

        use_admin_endpoints = False
        dataset: Optional[DatasetDetailModel] = None

        if headers:
            try:
                dataset = await dataset_client.get_admin_dataset(dataset_id, headers=headers)
                use_admin_endpoints = True
            except HTTPException as exc:
                if exc.status_code not in (401, 403, 404):
                    raise

        if dataset is None:
            dataset = await dataset_client.get_public_dataset(dataset_id, headers=headers)
        files_map = {file.id: file for file in dataset.files}

        if payload.dataset_file_ids:
            missing = [fid for fid in payload.dataset_file_ids if fid not in files_map]
            if missing:
                raise HTTPException(status_code=404, detail=f"Dataset file(s) not found: {', '.join(missing)}")
            not_ready = [fid for fid in payload.dataset_file_ids if files_map[fid].status != DatasetFileStatus.READY]
            if not_ready:
                raise HTTPException(status_code=409, detail=f"Dataset file(s) are not READY: {', '.join(not_ready)}")
            target_files = [files_map[fid] for fid in payload.dataset_file_ids]
        else:
            target_files = [file for file in dataset.files if file.status == DatasetFileStatus.READY]

        if not target_files:
            raise HTTPException(status_code=404, detail="No READY files available in the selected dataset.")

        run_id = uuid.uuid4().hex
        start_time = time.perf_counter()
        results, used_file_ids = await execute_search(
            run_id,
            dataset,
            target_files,
            payload,
            dataset_client,
            config,
            request_headers=headers,
            use_admin_endpoints=use_admin_endpoints,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        success_count = sum(1 for item in results if item.success)

        response = SearchRunResponse(
            run_id=run_id,
            dataset_id=dataset.id,
            dataset_name=dataset.name,
            pattern_name=payload.pattern_name,
            line_points=payload.line_points,
            star_params=payload.star_params,
            verify_tol_px=payload.verify_tol_px,
            score_threshold=payload.score_threshold,
            asset_preference=payload.asset_preference,
            requested_file_ids=payload.dataset_file_ids,
            used_file_ids=used_file_ids,
            results=results,
            success_count=success_count,
            total_files=len(target_files),
            duration_ms=duration_ms,
            created_at=datetime.utcnow(),
        )

        try:
            payload_dict = json.loads(response.json(by_alias=True))
            await dataset_client.persist_pattern_search_run(payload_dict, headers=headers)
        except Exception:
            logger.exception("Failed to persist pattern search run", {"run_id": run_id})

        return response

    return router


__all__ = ["create_router"]
