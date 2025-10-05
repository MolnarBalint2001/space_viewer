"""Entry points for the pattern finder service."""
from __future__ import annotations

from pattern_finder_service.app import app, create_app
from pattern_finder_service.cli import main as cli_main

__all__ = ["app", "create_app"]


if __name__ == "__main__":  # pragma: no cover
    cli_main()
