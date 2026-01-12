from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def obligation_due_at(obligation: models.Obligation) -> datetime | None:
    if obligation.next_due_at:
        return obligation.next_due_at
    if obligation.due_date:
        return datetime.combine(obligation.due_date, time(23, 59, 59))
    return None


def compute_status(
    *,
    current_status: str,
    due_at: datetime | None,
    now: datetime | None = None,
) -> str:
    if current_status == schemas.ObligationStatus.COMPLETED.value:
        return schemas.ObligationStatus.COMPLETED.value
    if due_at is None:
        return schemas.ObligationStatus.ON_TRACK.value

    n = now or now_utc()
    if due_at < n:
        return schemas.ObligationStatus.OVERDUE.value
    if due_at <= n + timedelta(days=14):
        return schemas.ObligationStatus.DUE_SOON.value
    return schemas.ObligationStatus.ON_TRACK.value


def refresh_status_in_memory(obligation: models.Obligation, now: datetime | None = None) -> None:
    obligation.status = compute_status(
        current_status=obligation.status, due_at=obligation_due_at(obligation), now=now
    )


def create_audit_event(
    db: Session,
    *,
    entity_type: schemas.EntityType,
    entity_id: int,
    action: schemas.AuditAction,
    details: Any | None = None,
) -> models.AuditEvent:
    event = models.AuditEvent(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action.value,
        details_json=json.dumps(details or {}, default=str),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def create_loan(db: Session, *, title: str) -> models.Loan:
    loan = models.Loan(title=title)
    db.add(loan)
    db.commit()
    db.refresh(loan)
    create_audit_event(
        db,
        entity_type="loan",
        entity_id=loan.id,
        action=schemas.AuditAction.CREATED,
        details={"title": title},
    )
    return loan


def list_loans(db: Session) -> list[models.Loan]:
    return list(db.execute(select(models.Loan).order_by(models.Loan.created_at.desc())).scalars())


def get_loan(db: Session, *, loan_id: int) -> models.Loan | None:
    return db.get(models.Loan, loan_id)


def store_loan_text(db: Session, *, loan: models.Loan, text: str) -> models.Loan:
    loan.raw_text = text
    db.add(loan)
    db.commit()
    db.refresh(loan)
    create_audit_event(
        db,
        entity_type="loan",
        entity_id=loan.id,
        action=schemas.AuditAction.UPDATED,
        details={"raw_text_length": len(text)},
    )
    return loan


def create_obligation(
    db: Session, *, loan_id: int, obligation_in: schemas.ObligationCreate
) -> models.Obligation:
    obligation = models.Obligation(
        loan_id=loan_id,
        name=obligation_in.name,
        obligation_type=obligation_in.obligation_type.value,
        description=obligation_in.description or "",
        party_responsible=obligation_in.party_responsible or "",
        frequency=obligation_in.frequency.value,
        due_date=obligation_in.due_date,
        due_rule=obligation_in.due_rule,
        next_due_at=obligation_in.next_due_at,
        status=(obligation_in.status.value if obligation_in.status else "ON_TRACK"),
        confidence=obligation_in.confidence,
        source_excerpt=obligation_in.source_excerpt,
        source_page=obligation_in.source_page,
    )
    refresh_status_in_memory(obligation)
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    create_audit_event(
        db,
        entity_type="obligation",
        entity_id=obligation.id,
        action=schemas.AuditAction.CREATED,
        details={"loan_id": loan_id, "name": obligation.name, "frequency": obligation.frequency},
    )
    return obligation


def list_obligations_for_loan(db: Session, *, loan_id: int) -> list[models.Obligation]:
    obligations = list(
        db.execute(
            select(models.Obligation)
            .where(models.Obligation.loan_id == loan_id)
            .order_by(models.Obligation.created_at.desc())
        ).scalars()
    )
    n = now_utc()
    for o in obligations:
        refresh_status_in_memory(o, now=n)
    return obligations


def get_obligation(db: Session, *, obligation_id: int) -> models.Obligation | None:
    obligation = db.get(models.Obligation, obligation_id)
    if obligation:
        refresh_status_in_memory(obligation)
    return obligation


def update_obligation(
    db: Session, *, obligation: models.Obligation, obligation_in: schemas.ObligationUpdate
) -> models.Obligation:
    patch = obligation_in.model_dump(exclude_unset=True)
    changed: dict[str, Any] = {}

    for field_name, value in patch.items():
        if field_name in {"obligation_type", "frequency", "status"} and value is not None:
            value = value.value
        if getattr(obligation, field_name) != value:
            changed[field_name] = {"from": getattr(obligation, field_name), "to": value}
            setattr(obligation, field_name, value)

    refresh_status_in_memory(obligation)
    db.add(obligation)
    db.commit()
    db.refresh(obligation)

    if changed:
        create_audit_event(
            db,
            entity_type="obligation",
            entity_id=obligation.id,
            action=schemas.AuditAction.UPDATED,
            details={"loan_id": obligation.loan_id, "changes": changed},
        )

    return obligation


def set_obligation_completed(db: Session, *, obligation: models.Obligation) -> models.Obligation:
    obligation.status = schemas.ObligationStatus.COMPLETED.value
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    create_audit_event(
        db,
        entity_type="obligation",
        entity_id=obligation.id,
        action=schemas.AuditAction.COMPLETED,
        details={"loan_id": obligation.loan_id},
    )
    return obligation


def reopen_obligation(db: Session, *, obligation: models.Obligation) -> models.Obligation:
    obligation.status = schemas.ObligationStatus.ON_TRACK.value
    refresh_status_in_memory(obligation)
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    create_audit_event(
        db,
        entity_type="obligation",
        entity_id=obligation.id,
        action=schemas.AuditAction.UPDATED,
        details={"reopened": True, "loan_id": obligation.loan_id},
    )
    return obligation


def delete_obligation(db: Session, *, obligation: models.Obligation) -> None:
    obligation_id = obligation.id
    loan_id = obligation.loan_id
    db.delete(obligation)
    db.commit()
    create_audit_event(
        db,
        entity_type="obligation",
        entity_id=obligation_id,
        action=schemas.AuditAction.DELETED,
        details={"loan_id": loan_id},
    )


def create_evidence(
    db: Session, *, obligation_id: int, filename: str, file_path: str, note: str | None
) -> models.Evidence:
    obligation = db.get(models.Obligation, obligation_id)
    evidence = models.Evidence(
        obligation_id=obligation_id, filename=filename, file_path=file_path, note=note
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    create_audit_event(
        db,
        entity_type="evidence",
        entity_id=evidence.id,
        action=schemas.AuditAction.EVIDENCE_UPLOADED,
        details={
            "loan_id": obligation.loan_id if obligation else None,
            "obligation_id": obligation_id,
            "filename": filename,
        },
    )
    return evidence


def list_evidence(db: Session, *, obligation_id: int) -> list[models.Evidence]:
    return list(
        db.execute(
            select(models.Evidence)
            .where(models.Evidence.obligation_id == obligation_id)
            .order_by(models.Evidence.uploaded_at.desc())
        ).scalars()
    )


def get_evidence(db: Session, *, evidence_id: int) -> models.Evidence | None:
    return db.get(models.Evidence, evidence_id)


def loan_summary(db: Session, *, loan_id: int) -> schemas.LoanSummary:
    obligations = list_obligations_for_loan(db, loan_id=loan_id)
    total = len(obligations)
    due_soon = sum(1 for o in obligations if o.status == schemas.ObligationStatus.DUE_SOON.value)
    overdue = sum(1 for o in obligations if o.status == schemas.ObligationStatus.OVERDUE.value)
    on_track = sum(1 for o in obligations if o.status == schemas.ObligationStatus.ON_TRACK.value)
    completed = sum(1 for o in obligations if o.status == schemas.ObligationStatus.COMPLETED.value)
    return schemas.LoanSummary(
        total=total, due_soon=due_soon, overdue=overdue, on_track=on_track, completed=completed
    )
