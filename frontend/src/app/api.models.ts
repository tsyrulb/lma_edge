export type ObligationType =
  | 'REPORTING'
  | 'COVENANT'
  | 'NOTICE'
  | 'INFORMATION'
  | 'EVENT';

export type Frequency =
  | 'ONCE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUAL'
  | 'ANNUAL'
  | 'AD_HOC';

export type ObligationStatus = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';

export interface Loan {
  id: number;
  title: string;
  created_at: string;
}

export interface LoanSummary {
  total: number;
  due_soon: number;
  overdue: number;
  on_track: number;
  completed: number;
}

export interface LoanDetail extends Loan {
  summary: LoanSummary;
}

export interface Obligation {
  id: number;
  loan_id: number;
  name: string;
  obligation_type: string;
  description: string;
  party_responsible: string;
  frequency: string;
  due_date: string | null;
  due_rule: string | null;
  next_due_at: string | null;
  status: string;
  confidence: number | null;
  source_excerpt: string | null;
  source_page: number | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: number;
  obligation_id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
  note: string | null;
}

export interface AuditEvent {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  details_json: string;
  at: string;
}

