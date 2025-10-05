from __future__ import annotations

from typing import Any

from pydantic import BaseModel

try:
    from pydantic import ConfigDict  # type: ignore[attr-defined]
except ImportError:  # pragma: no cover
    ConfigDict = None  # type: ignore[assignment]


class CamelModel(BaseModel):
    """Base Pydantic model using camelCase aliases."""

    if ConfigDict is not None:  # pragma: no branch
        model_config = ConfigDict(
            populate_by_name=True,
            extra="ignore",
            arbitrary_types_allowed=True,
        )
    else:  # pragma: no cover

        class Config:  # type: ignore[override]
            allow_population_by_field_name = True
            extra = "ignore"
            arbitrary_types_allowed = True

    def dict(self, *args: Any, **kwargs: Any) -> dict[str, Any]:  # noqa: D401
        """Return dict with aliases by default."""

        if "by_alias" not in kwargs:
            kwargs["by_alias"] = True
        return super().dict(*args, **kwargs)


__all__ = ["CamelModel"]
