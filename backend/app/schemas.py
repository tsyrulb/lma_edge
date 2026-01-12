from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ObligationType(str, Enum):
    REPORTING = "REPORTING"
    COVENANT = "COVENANT"
    NOTICE = "NOTICE"
    INFORMATION = "INFORMATION"
    EVENT = "EVENT"


class Frequency(str, Enum):
    ONCE = "ONCE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUAL = "SEMI_ANNUAL"
    ANNUAL = "ANNUAL"
    AD_HOC = "AD_HOC"


class ObligationStatus(str, Enum):
    ON_TRACK = "ON_TRACK"
    DUE_SOON = "DUE_SOON"
    OVERDUE = "OVERDUE"
    COMPLETED = "COMPLETED"


class AuditAction(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    COMPLETED = "COMPLETED"
    EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
    DELETED = "DELETED"


EntityType = Literal["obligation", "loan", "evidence"]


class LoanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class LoanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class LoanSummary(BaseModel):
    total: int
    due_soon: int
    overdue: int
    on_track: int
    completed: int


class LoanDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    summary: LoanSummary


class ImportTextIn(BaseModel):
    text: str = Field(min_length=1)


class ExtractIn(BaseModel):
    text: str | None = None


class ObligationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    obligation_type: ObligationType
    description: str = ""
    party_responsible: str = ""
    frequency: Frequency = Frequency.ONCE
    due_date: date | None = None
    due_rule: str | None = None
    next_due_at: datetime | None = None
    status: ObligationStatus | None = None
    confidence: float | None = None
    source_excerpt: str | None = None
    source_page: int | None = None


class ObligationCreate(ObligationBase):
    pass


class ObligationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    obligation_type: ObligationType | None = None
    description: str | None = None
    party_responsible: str | None = None
    frequency: Frequency | None = None
    due_date: date | None = None
    due_rule: str | None = None
    next_due_at: datetime | None = None
    status: ObligationStatus | None = None
    confidence: float | None = None
    source_excerpt: str | None = None
    source_page: int | None = None


class ObligationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_id: int
    name: str
    obligation_type: str
    description: str
    party_responsible: str
    frequency: str
    due_date: date | None
    due_rule: str | None
    next_due_at: datetime | None
    status: str
    confidence: float | None
    source_excerpt: str | None
    source_page: int | None
    created_at: datetime
    updated_at: datetime


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    obligation_id: int
    filename: str
    file_path: str
    uploaded_at: datetime
    note: str | None


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_id: int
    action: str
    details_json: str
    at: datetime


class ExtractedObligation(BaseModel):
    name: str
    obligation_type: ObligationType
    description: str
    party_responsible: str
    frequency: Frequency
    due_date: date | None = None
    due_rule: str | None = None
    next_due_at: datetime | None = None
    confidence: float | None = None
    source_excerpt: str | None = None
    source_page: int | None = None

    def to_create(self) -> "ObligationCreate":
        return ObligationCreate(
            name=self.name,
            obligation_type=self.obligation_type,
            description=self.description,
            party_responsible=self.party_responsible,
            frequency=self.frequency,
            due_date=self.due_date,
            due_rule=self.due_rule,
            next_due_at=self.next_due_at,
            confidence=self.confidence,
            source_excerpt=self.source_excerpt,
            source_page=self.source_page,
        )


class ExtractResult(BaseModel):
    obligations: list[ObligationOut]
    extracted: list[ExtractedObligation] | None = None
    meta: dict[str, Any] = Field(default_factory=dict)
