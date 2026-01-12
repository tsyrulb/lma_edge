from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import evidence, exports, loans, obligations


def create_app() -> FastAPI:
    app = FastAPI(title="CovenantOps API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(loans.router, prefix="/api")
    app.include_router(obligations.router, prefix="/api")
    app.include_router(evidence.router, prefix="/api")
    app.include_router(exports.router, prefix="/api")

    @app.on_event("startup")
    def _startup() -> None:
        import os
        from pathlib import Path

        init_db()
        Path(os.getenv("STORAGE_DIR", "./storage")).mkdir(parents=True, exist_ok=True)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
