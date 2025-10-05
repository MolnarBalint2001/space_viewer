"""Pattern finder service package."""
from __future__ import annotations

import logging

LOGGER_NAME = "pattern_finder_service"

logger = logging.getLogger(LOGGER_NAME)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "\n%(asctime)s %(levelname)s [%(name)s] %(message)s args=%(args)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

__all__ = ["logger", "LOGGER_NAME"]
