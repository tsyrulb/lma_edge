from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.db import get_db
from app.services.extractor import get_extractor

router = APIRouter(tags=["loans"])


@router.get("/loans", response_model=list[schemas.LoanOut])
def list_loans(db: Session = Depends(get_db)):
    return crud.list_loans(db)


@router.post("/loans", response_model=schemas.LoanOut)
def create_loan(payload: schemas.LoanCreate, db: Session = Depends(get_db)):
    return crud.create_loan(db, title=payload.title)


@router.get("/loans/{loan_id}", response_model=schemas.LoanDetailOut)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    summary = crud.loan_summary(db, loan_id=loan_id)
    return schemas.LoanDetailOut(id=loan.id, title=loan.title, created_at=loan.created_at, summary=summary)


@router.post("/loans/{loan_id}/import-text", response_model=schemas.LoanOut)
def import_text(loan_id: int, payload: schemas.ImportTextIn, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    loan = crud.store_loan_text(db, loan=loan, text=payload.text)
    return loan


@router.post("/loans/{loan_id}/extract", response_model=schemas.ExtractResult)
def extract_obligations(loan_id: int, payload: schemas.ExtractIn | None = None, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    text = (payload.text if payload else None) or loan.raw_text
    if not text:
        raise HTTPException(status_code=400, detail="No text available to extract from")

    extractor = get_extractor()
    extracted = extractor.extract_obligations(text)
    created = [crud.create_obligation(db, loan_id=loan_id, obligation_in=o.to_create()) for o in extracted]
    return schemas.ExtractResult(
        obligations=created,
        extracted=extracted,
        meta={"extractor": getattr(extractor, "name", "unknown"), "count": len(created)},
    )
