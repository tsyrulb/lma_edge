from __future__ import annotations

from datetime import datetime, timezone

from jinja2 import Environment, select_autoescape

from app import models

_env = Environment(autoescape=select_autoescape(["html", "xml"]))

_TEMPLATE = _env.from_string(
    """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compliance Packet - {{ loan.title }}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1 { margin: 0 0 4px 0; }
      .meta { color: #555; margin-bottom: 16px; }
      .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
      .ON_TRACK { background: #e7f5ff; color: #0b7285; }
      .DUE_SOON { background: #fff3bf; color: #8a5b00; }
      .OVERDUE { background: #ffe3e3; color: #c92a2a; }
      .COMPLETED { background: #d3f9d8; color: #2b8a3e; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
      th { text-align: left; background: #fafafa; }
      .small { font-size: 12px; color: #555; }
      a { color: #1c7ed6; text-decoration: none; }
      .evidence { margin: 6px 0 0 0; padding: 0 0 0 16px; }
      .evidence li { margin: 2px 0; }
      @media print {
        a { color: #000; text-decoration: underline; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 12px;">
      <button onclick="window.print()">Print</button>
    </div>
    <h1>Compliance Packet</h1>
    <div class="meta">
      <div><strong>Loan:</strong> {{ loan.title }}</div>
      <div><strong>Generated:</strong> {{ generated_at }}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Obligation</th>
          <th style="width: 10%;">Type</th>
          <th style="width: 12%;">Frequency</th>
          <th style="width: 18%;">Due</th>
          <th style="width: 10%;">Status</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>
            <div><strong>{{ item.obligation.name }}</strong></div>
            {% if item.obligation.description %}
              <div class="small">{{ item.obligation.description }}</div>
            {% endif %}
            {% if item.obligation.due_rule %}
              <div class="small"><em>{{ item.obligation.due_rule }}</em></div>
            {% endif %}
          </td>
          <td>{{ item.obligation.obligation_type }}</td>
          <td>{{ item.obligation.frequency }}</td>
          <td>
            {% if item.obligation.next_due_at %}
              {{ item.obligation.next_due_at }}
            {% elif item.obligation.due_date %}
              {{ item.obligation.due_date }}
            {% else %}
              —
            {% endif %}
          </td>
          <td><span class="pill {{ item.obligation.status }}">{{ item.obligation.status }}</span></td>
          <td>
            {% if item.evidence and item.evidence|length > 0 %}
              <ul class="evidence">
                {% for e in item.evidence %}
                <li>
                  <a href="{{ api_base }}/evidence/{{ e.id }}/download">{{ e.filename }}</a>
                  <span class="small">({{ e.uploaded_at }})</span>
                  {% if e.note %}<span class="small">— {{ e.note }}</span>{% endif %}
                </li>
                {% endfor %}
              </ul>
            {% else %}
              <span class="small">No evidence uploaded</span>
            {% endif %}
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </body>
</html>
"""
)


def render_compliance_packet(
    *,
    loan: models.Loan,
    obligations: list[models.Obligation],
    evidence_by_obligation_id: dict[int, list[models.Evidence]],
    api_base: str,
) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    items = [
        {"obligation": o, "evidence": evidence_by_obligation_id.get(o.id, [])} for o in obligations
    ]
    return _TEMPLATE.render(loan=loan, items=items, generated_at=generated_at, api_base=api_base)
