from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.routes import create_router
from .clients.dataset_server import DatasetServerClient
from .config import get_config


def create_app() -> FastAPI:
    config = get_config()
    dataset_client = DatasetServerClient(config)

    app = FastAPI(
        title="Pattern Finder Service",
        version="0.1.0",
        description="FastAPI interface around the star pattern search utilities.",
    )

    cors_origins = list(config.cors_origins) or ["*"]
    allow_credentials = "*" not in cors_origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=allow_credentials,
    )

    router = create_router(config=config, dataset_client=dataset_client)
    app.include_router(router)

    app.mount("/results", StaticFiles(directory=str(config.results_dir), check_dir=False), name="results")

    app.state.config = config
    app.state.dataset_client = dataset_client

    return app


app = create_app()


__all__ = ["app", "create_app"]
