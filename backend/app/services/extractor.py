from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from typing import Protocol

from app import schemas


class ObligationExtractor(Protocol):
    def extract_obligations(self, text: str) -> list[schemas.ExtractedObligation]: ...


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


class MockExtractor:
    name = "mock"

    def extract_obligations(self, text: str) -> list[schemas.ExtractedObligation]:
        now = _now()
        today = date.today()

        def dt_in(days: int) -> datetime:
            return now + timedelta(days=days)

        def d_in(days: int) -> date:
            return today + timedelta(days=days)

        excerpt = (
            (text or "").strip().replace("\n", " ")[:240]
            or "Borrower shall deliver the following information within the required time periods."
        )

        obligations: list[schemas.ExtractedObligation] = [
            schemas.ExtractedObligation(
                name="Quarterly financial statements",
                obligation_type=schemas.ObligationType.REPORTING,
                description="Deliver quarterly unaudited consolidated financial statements.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.QUARTERLY,
                due_rule="Within 45 days after quarter-end",
                next_due_at=dt_in(10),
                confidence=0.88,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Quarterly compliance certificate",
                obligation_type=schemas.ObligationType.REPORTING,
                description="Deliver an officer’s certificate confirming covenant compliance.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.QUARTERLY,
                due_rule="Together with quarterly financial statements",
                next_due_at=dt_in(10),
                confidence=0.82,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Monthly borrowing base certificate",
                obligation_type=schemas.ObligationType.REPORTING,
                description="Deliver borrowing base certificate with supporting schedules.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.MONTHLY,
                due_rule="Within 15 days after month-end",
                next_due_at=dt_in(2),
                confidence=0.8,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Annual audited financial statements",
                obligation_type=schemas.ObligationType.REPORTING,
                description="Deliver annual audited financial statements.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.ANNUAL,
                due_rule="Within 120 days after fiscal year-end",
                next_due_at=dt_in(60),
                confidence=0.9,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Leverage ratio maintenance covenant",
                obligation_type=schemas.ObligationType.COVENANT,
                description="Maintain a maximum leverage ratio, tested quarterly.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.QUARTERLY,
                due_rule="Tested quarterly; reported with compliance certificate",
                next_due_at=dt_in(-3),
                confidence=0.7,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Notice of Default / Event of Default",
                obligation_type=schemas.ObligationType.NOTICE,
                description="Notify Agent promptly upon becoming aware of a Default or Event of Default.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.AD_HOC,
                due_rule="Within 2 business days of awareness",
                confidence=0.78,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Negative pledge (ongoing)",
                obligation_type=schemas.ObligationType.COVENANT,
                description="Do not create or permit liens except as permitted under the agreement.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.AD_HOC,
                due_rule="Ongoing; monitor continuously",
                confidence=0.65,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Annual budget delivery",
                obligation_type=schemas.ObligationType.INFORMATION,
                description="Deliver annual operating budget and projections for the upcoming fiscal year.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.ANNUAL,
                due_rule="No later than 30 days prior to fiscal year start",
                next_due_at=dt_in(20),
                confidence=0.74,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Material litigation notice",
                obligation_type=schemas.ObligationType.EVENT,
                description="Notify Agent of any material litigation or governmental investigation.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.AD_HOC,
                due_rule="Promptly upon occurrence",
                confidence=0.62,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="ESG KPI report (optional)",
                obligation_type=schemas.ObligationType.REPORTING,
                description="Deliver annual ESG KPI reporting package (if applicable).",
                party_responsible="Borrower",
                frequency=schemas.Frequency.ANNUAL,
                due_rule="Annually within 90 days after fiscal year-end",
                next_due_at=dt_in(12),
                confidence=0.6,
                source_excerpt=excerpt,
            ),
            schemas.ExtractedObligation(
                name="Initial conditions precedent checklist",
                obligation_type=schemas.ObligationType.INFORMATION,
                description="Provide initial closing deliverables checklist and confirmations.",
                party_responsible="Borrower",
                frequency=schemas.Frequency.ONCE,
                due_date=d_in(-1),
                due_rule="On or before closing",
                confidence=0.55,
                source_excerpt=excerpt,
            ),
        ]

        if "esg" not in (text or "").lower():
            obligations = [o for o in obligations if "ESG" not in o.name]

        return obligations


class LLMExtractor:
    name = "llm"

    def extract_obligations(self, text: str) -> list[schemas.ExtractedObligation]:
        raise NotImplementedError("LLM extraction not enabled for MVP; use MockExtractor.")


def get_extractor() -> ObligationExtractor:
    provider = os.getenv("EXTRACTOR_PROVIDER", "mock").lower()
    if provider == "llm":
        return LLMExtractor()
    return MockExtractor()


def extract_obligations(text: str) -> list[schemas.ExtractedObligation]:
    return get_extractor().extract_obligations(text)
