from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.db import get_db

router = APIRouter(tags=["obligations"])


@router.get("/loans/{loan_id}/obligations", response_model=list[schemas.ObligationOut])
def list_obligations(loan_id: int, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return crud.list_obligations_for_loan(db, loan_id=loan_id)


@router.post("/loans/{loan_id}/obligations", response_model=schemas.ObligationOut)
def create_obligation(loan_id: int, payload: schemas.ObligationCreate, db: Session = Depends(get_db)):
    loan = crud.get_loan(db, loan_id=loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return crud.create_obligation(db, loan_id=loan_id, obligation_in=payload)


@router.put("/obligations/{obligation_id}", response_model=schemas.ObligationOut)
def update_obligation(
    obligation_id: int, payload: schemas.ObligationUpdate, db: Session = Depends(get_db)
):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return crud.update_obligation(db, obligation=obligation, obligation_in=payload)


@router.post("/obligations/{obligation_id}/complete", response_model=schemas.ObligationOut)
def complete_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return crud.set_obligation_completed(db, obligation=obligation)


@router.post("/obligations/{obligation_id}/reopen", response_model=schemas.ObligationOut)
def reopen_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return crud.reopen_obligation(db, obligation=obligation)


@router.delete("/obligations/{obligation_id}")
def delete_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = crud.get_obligation(db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    crud.delete_obligation(db, obligation=obligation)
    return {"deleted": True}
