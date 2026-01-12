from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.db import get_db
from app.services.calendar_export import build_ics
from app.services.compliance_packet import render_compliance_packet

router = APIRouter(tags=["exports"])


@router.get("/loans/{loan_id}/export.ics")
def export_ics(loan_id: int, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    obligations = crud.list_obligations_for_loan(db, loan_id=loan_id)
    ics = build_ics(loan, obligations)
    headers = {"Content-Disposition": f'attachment; filename="loan-{loan_id}-obligations.ics"'}
    return Response(content=ics, media_type="text/calendar", headers=headers)


@router.get("/loans/{loan_id}/compliance-packet", response_class=HTMLResponse)
def compliance_packet(loan_id: int, request: Request, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    obligations = crud.list_obligations_for_loan(db, loan_id=loan_id)
    evidence_by_obligation_id: dict[int, list[models.Evidence]] = {}
    for o in obligations:
        evidence_by_obligation_id[o.id] = crud.list_evidence(db, obligation_id=o.id)

    api_base = str(request.base_url).rstrip("/") + "/api"
    html = render_compliance_packet(
        loan=loan,
        obligations=obligations,
        evidence_by_obligation_id=evidence_by_obligation_id,
        api_base=api_base,
    )
    return HTMLResponse(content=html)


@router.get("/audit", response_model=list[schemas.AuditEventOut])
def audit(loan_id: int | None = None, obligation_id: int | None = None, db: Session = Depends(get_db)):
    events = list(
        db.execute(select(models.AuditEvent).order_by(models.AuditEvent.at.desc()).limit(200)).scalars()
    )

    def matches_filters(e: models.AuditEvent) -> bool:
        if loan_id is None and obligation_id is None:
            return True

        details: dict[str, object] = {}
        try:
            details = json.loads(e.details_json or "{}")
        except Exception:
            details = {}

        if loan_id is not None:
            if e.entity_type == "loan" and e.entity_id == loan_id:
                pass
            elif details.get("loan_id") != loan_id:
                return False

        if obligation_id is not None:
            if e.entity_type == "obligation" and e.entity_id == obligation_id:
                return True
            if details.get("obligation_id") != obligation_id:
                return False

        return True

    return [e for e in events if matches_filters(e)]
