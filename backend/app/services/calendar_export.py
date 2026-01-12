from __future__ import annotations

from datetime import datetime, timezone

from app import crud, models


def _format_dt(dt: datetime) -> str:
    dt_utc = dt.replace(tzinfo=timezone.utc)
    return dt_utc.strftime("%Y%m%dT%H%M%SZ")


def _format_date(d) -> str:
    return d.strftime("%Y%m%d")


def _escape(text: str) -> str:
    return (
        (text or "")
        .replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def build_ics(loan: models.Loan, obligations: list[models.Obligation]) -> str:
    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    lines: list[str] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CovenantOps//EN",
        "CALSCALE:GREGORIAN",
        f"X-WR-CALNAME:{_escape(loan.title)} Obligations",
    ]

    for o in obligations:
        due_at = crud.obligation_due_at(o)
        if not due_at:
            continue

        uid = f"obligation-{o.id}@covenantops.local"
        summary = _escape(o.name)
        description = _escape(
            " | ".join(
                [
                    f"Type: {o.obligation_type}",
                    f"Status: {o.status}",
                    f"Rule: {o.due_rule or 'N/A'}",
                ]
            )
        )

        lines.append("BEGIN:VEVENT")
        lines.append(f"UID:{uid}")
        lines.append(f"DTSTAMP:{_format_dt(now)}")
        if o.due_date and not o.next_due_at:
            lines.append(f"DTSTART;VALUE=DATE:{_format_date(o.due_date)}")
        else:
            if due_at.tzinfo is not None:
                due_at = due_at.astimezone(timezone.utc).replace(tzinfo=None)
            lines.append(f"DTSTART:{_format_dt(due_at)}")
        lines.append(f"SUMMARY:{summary}")
        lines.append(f"DESCRIPTION:{description}")
        lines.append("END:VEVENT")

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
