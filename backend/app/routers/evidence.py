from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, schemas
from app.db import get_db

router = APIRouter(tags=["evidence"])


def _storage_root() -> Path:
    return Path(os.getenv("STORAGE_DIR", "./storage"))


@router.post("/obligations/{obligation_id}/evidence", response_model=schemas.EvidenceOut)
def upload_evidence(
    obligation_id: int,
    file: UploadFile = File(...),
    note: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")

    root = _storage_root()
    rel_dir = Path(f"obligation_{obligation_id}")
    target_dir = root / rel_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name
    rel_path = rel_dir / f"{uuid4().hex}_{safe_name}"
    full_path = root / rel_path

    with full_path.open("wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    return crud.create_evidence(
        db,
        obligation_id=obligation_id,
        filename=safe_name,
        file_path=str(rel_path).replace("\\", "/"),
        note=note,
    )


@router.get("/obligations/{obligation_id}/evidence", response_model=list[schemas.EvidenceOut])
def list_evidence(obligation_id: int, db: Session = Depends(get_db)):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return crud.list_evidence(db, obligation_id=obligation_id)


@router.get("/evidence/{evidence_id}/download")
def download_evidence(evidence_id: int, db: Session = Depends(get_db)):
    evidence = crud.get_evidence(db, evidence_id=evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    root = _storage_root()
    full_path = root / Path(evidence.file_path)
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Evidence file missing on disk")

    return FileResponse(
        path=str(full_path),
        filename=evidence.filename,
        media_type="application/octet-stream",
    )
