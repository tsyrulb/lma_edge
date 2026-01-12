from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    obligations: Mapped[list["Obligation"]] = relationship(
        back_populates="loan", cascade="all, delete-orphan"
    )


class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    obligation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    party_responsible: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    frequency: Mapped[str] = mapped_column(String(50), nullable=False, default="ONCE")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    next_due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="ON_TRACK")
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    loan: Mapped["Loan"] = relationship(back_populates="obligations")
    evidence: Mapped[list["Evidence"]] = relationship(
        back_populates="obligation", cascade="all, delete-orphan"
    )


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    obligation_id: Mapped[int] = mapped_column(
        ForeignKey("obligations.id"), index=True, nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    obligation: Mapped["Obligation"] = relationship(back_populates="evidence")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    details_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False, index=True)
