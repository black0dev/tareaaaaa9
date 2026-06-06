from typing import Any

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class APIResponse(BaseModel):
    ok: bool
    data: Any | None = None
    meta: dict[str, Any] | None = None
    error: ErrorDetail | None = None

    @classmethod
    def success(cls, data: Any = None, meta: dict[str, Any] | None = None) -> "APIResponse":
        return cls(ok=True, data=data, meta=meta or {})

    @classmethod
    def fail(
        cls, code: str, message: str, details: dict[str, Any] | None = None
    ) -> "APIResponse":
        return cls(ok=False, error=ErrorDetail(code=code, message=message, details=details))
