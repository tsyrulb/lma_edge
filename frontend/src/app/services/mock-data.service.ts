import { Injectable } from '@angular/core';
import { AuditEvent, Evidence, Loan, LoanDetail, Obligation, ObligationStatus } from '../api.models';

interface DemoDataStore {
  loans: Loan[];
  obligations: Obligation[];
  evidence: Evidence[];
  auditEvents: AuditEvent[];
  nextIds: {
    loan: number;
    obligation: number;
    evidence: number;
    audit: number;
  };
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly STORAGE_KEY = 'covenantops-demo-data';
  private readonly DEMO_MODE_KEY = 'covenantops-demo-mode';

  constructor() {
    // Auto-enable demo mode on GitHub Pages or static hosting
    if (this.isStaticHosting()) {
      this.enableDemoMode();
    }
    
    // Initialize demo data if not exists
    if (!this.getStoredData()) {
      this.resetDemoData();
    }
  }

  // Environment detection
  private isStaticHosting(): boolean {
    const hostname = window.location.hostname;
    // Check for common static hosting patterns
    return hostname.includes('github.io') || 
           hostname.includes('netlify.app') ||
           hostname.includes('vercel.app') ||
           hostname.includes('surge.sh') ||
           // Generic check for HTTPS static sites without backend indicators
           (window.location.protocol === 'https:' && 
            !hostname.includes('localhost') && 
            !hostname.includes('127.0.0.1') &&
            !hostname.includes('dev') &&
            !hostname.includes('staging') &&
            !hostname.includes('api'));
  }

  // Configuration methods
  isDemoMode(): boolean {
    return localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
  }

  enableDemoMode(): void {
    localStorage.setItem(this.DEMO_MODE_KEY, 'true');
    if (!this.getStoredData()) {
      this.resetDemoData();
    }
  }

  disableDemoMode(): void {
    localStorage.setItem(this.DEMO_MODE_KEY, 'false');
  }

  resetDemoData(): void {
    const initialData: DemoDataStore = {
      loans: [],
      obligations: [],
      evidence: [],
      auditEvents: [],
      nextIds: {
        loan: 1,
        obligation: 1,
        evidence: 1,
        audit: 1
      }
    };
    this.saveData(initialData);
    this.generateSampleLoans();
  }

  // Environment information
  getEnvironmentInfo(): { isStaticHosting: boolean; hostname: string; protocol: string; isDemoMode: boolean } {
    return {
      isStaticHosting: this.isStaticHosting(),
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isDemoMode: this.isDemoMode()
    };
  }

  // Data persistence methods
  private getStoredData(): DemoDataStore | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private saveData(data: DemoDataStore): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private getData(): DemoDataStore {
    return this.getStoredData() || {
      loans: [],
      obligations: [],
      evidence: [],
      auditEvents: [],
      nextIds: { loan: 1, obligation: 1, evidence: 1, audit: 1 }
    };
  }

  // Loan operations
  async listLoans(): Promise<Loan[]> {
    const data = this.getData();
    return Promise.resolve([...data.loans]);
  }

  async createLoan(title: string): Promise<Loan> {
    const data = this.getData();
    const loan: Loan = {
      id: data.nextIds.loan++,
      title,
      created_at: new Date().toISOString()
    };
    
    data.loans.push(loan);
    this.saveData(data);
    this.addAuditEvent('loan', loan.id, 'created', { title });
    
    return Promise.resolve(loan);
  }

  async getLoan(loanId: number): Promise<LoanDetail> {
    const data = this.getData();
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const obligations = data.obligations.filter(o => o.loan_id === loanId);
    const summary = this.calculateLoanSummary(obligations);

    return Promise.resolve({
      ...loan,
      summary
    });
  }

  // Obligation operations
  async listObligations(loanId: number): Promise<Obligation[]> {
    const data = this.getData();
    const obligations = data.obligations.filter(o => o.loan_id === loanId);
    return Promise.resolve([...obligations]);
  }

  async createObligation(loanId: number, payload: Partial<Obligation>): Promise<Obligation> {
    const data = this.getData();
    const now = new Date().toISOString();
    
    const obligation: Obligation = {
      id: data.nextIds.obligation++,
      loan_id: loanId,
      name: payload.name || '',
      obligation_type: payload.obligation_type || 'REPORTING',
      description: payload.description || '',
      party_responsible: payload.party_responsible || 'Borrower',
      frequency: payload.frequency || 'ONCE',
      due_date: payload.due_date || null,
      due_rule: payload.due_rule || null,
      next_due_at: payload.next_due_at || null,
      status: payload.status || 'ON_TRACK',
      confidence: payload.confidence || null,
      source_excerpt: payload.source_excerpt || null,
      source_page: payload.source_page || null,
      created_at: now,
      updated_at: now
    };

    data.obligations.push(obligation);
    this.saveData(data);
    this.addAuditEvent('obligation', obligation.id, 'created', payload);

    return Promise.resolve(obligation);
  }

  async updateObligation(obligationId: number, payload: Partial<Obligation>): Promise<Obligation> {
    const data = this.getData();
    const index = data.obligations.findIndex(o => o.id === obligationId);
    if (index === -1) {
      throw new Error(`Obligation ${obligationId} not found`);
    }

    const updated = {
      ...data.obligations[index],
      ...payload,
      updated_at: new Date().toISOString()
    };

    data.obligations[index] = updated;
    this.saveData(data);
    this.addAuditEvent('obligation', obligationId, 'updated', payload);

    return Promise.resolve(updated);
  }

  async completeObligation(obligationId: number): Promise<Obligation> {
    return this.updateObligation(obligationId, { status: 'COMPLETED' });
  }

  async reopenObligation(obligationId: number): Promise<Obligation> {
    return this.updateObligation(obligationId, { status: 'ON_TRACK' });
  }

  async deleteObligation(obligationId: number): Promise<{ deleted: boolean }> {
    const data = this.getData();
    const index = data.obligations.findIndex(o => o.id === obligationId);
    if (index === -1) {
      throw new Error(`Obligation ${obligationId} not found`);
    }

    data.obligations.splice(index, 1);
    // Also remove related evidence
    data.evidence = data.evidence.filter(e => e.obligation_id !== obligationId);
    this.saveData(data);
    this.addAuditEvent('obligation', obligationId, 'deleted', {});

    return Promise.resolve({ deleted: true });
  }

  // Evidence operations
  async listEvidence(obligationId: number): Promise<Evidence[]> {
    const data = this.getData();
    const evidence = data.evidence.filter(e => e.obligation_id === obligationId);
    return Promise.resolve([...evidence]);
  }

  async uploadEvidence(obligationId: number, file: File, note?: string): Promise<Evidence> {
    const data = this.getData();
    const evidence: Evidence = {
      id: data.nextIds.evidence++,
      obligation_id: obligationId,
      filename: file.name,
      file_path: `/demo/evidence/${file.name}`, // Mock file path
      uploaded_at: new Date().toISOString(),
      note: note || null
    };

    data.evidence.push(evidence);
    this.saveData(data);
    this.addAuditEvent('evidence', evidence.id, 'uploaded', { filename: file.name, note });

    return Promise.resolve(evidence);
  }

  // Audit operations
  async listAudit(loanId?: number, obligationId?: number): Promise<AuditEvent[]> {
    const data = this.getData();
    let events = [...data.auditEvents];

    if (loanId !== undefined) {
      events = events.filter(e => 
        (e.entity_type === 'loan' && e.entity_id === loanId) ||
        (e.entity_type === 'obligation' && data.obligations.find(o => o.id === e.entity_id && o.loan_id === loanId))
      );
    }

    if (obligationId !== undefined) {
      events = events.filter(e => 
        (e.entity_type === 'obligation' && e.entity_id === obligationId) ||
        (e.entity_type === 'evidence' && data.evidence.find(ev => ev.id === e.entity_id && ev.obligation_id === obligationId))
      );
    }

    return Promise.resolve(events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()));
  }

  // Additional methods for demo functionality
  async health(): Promise<{ status: string }> {
    return Promise.resolve({ status: 'ok' });
  }

  async importText(loanId: number, text: string): Promise<Loan> {
    // Mock implementation - just return the loan
    const loan = await this.getLoan(loanId);
    this.addAuditEvent('loan', loanId, 'text_imported', { text_length: text.length });
    return loan;
  }

  async extract(loanId: number, text?: string): Promise<{ obligations: Obligation[] }> {
    // If text is provided and contains meaningful content, simulate extraction
    if (text && text.trim() && text.trim() !== 'Demo data generation') {
      // For now, return empty as real extraction is not implemented
      return Promise.resolve({ obligations: [] });
    }
    
    // Generate demo obligations when specifically requested or when no meaningful text
    const data = this.getData();
    const existingObligations = data.obligations.filter((o: any) => o.loan_id === loanId);
    
    // If obligations already exist for this loan, return them
    if (existingObligations.length > 0) {
      return Promise.resolve({ obligations: existingObligations });
    }
    
    // Generate new sample obligations for this loan
    this.generateObligationsForLoan(data, loanId, 6); // Generate 6 sample obligations
    this.saveData(data);
    
    const newObligations = data.obligations.filter((o: any) => o.loan_id === loanId);
    return Promise.resolve({ obligations: newObligations });
  }

  // Helper methods
  private calculateLoanSummary(obligations: Obligation[]) {
    const summary = {
      total: obligations.length,
      due_soon: 0,
      overdue: 0,
      on_track: 0,
      completed: 0
    };

    obligations.forEach(o => {
      switch (o.status as ObligationStatus) {
        case 'DUE_SOON':
          summary.due_soon++;
          break;
        case 'OVERDUE':
          summary.overdue++;
          break;
        case 'ON_TRACK':
          summary.on_track++;
          break;
        case 'COMPLETED':
          summary.completed++;
          break;
      }
    });

    return summary;
  }

  private addAuditEvent(entityType: string, entityId: number, action: string, details: any): void {
    const data = this.getData();
    const event: AuditEvent = {
      id: data.nextIds.audit++,
      entity_type: entityType,
      entity_id: entityId,
      action,
      details_json: JSON.stringify(details),
      at: new Date().toISOString()
    };

    data.auditEvents.push(event);
    this.saveData(data);
  }

  // Sample data generation
  generateSampleLoans(): void {
    const data = this.getData();
    
    // Sample loan data
    const sampleLoans = [
      { title: 'DemoCo Facility Agreement' },
      { title: 'TechStart Revolving Credit' }
    ];

    // Create sample loans
    sampleLoans.forEach(loanData => {
      const loan: Loan = {
        id: data.nextIds.loan++,
        title: loanData.title,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
      };
      data.loans.push(loan);

      // Generate 8-12 obligations per loan
      const obligationCount = 8 + Math.floor(Math.random() * 5); // 8-12 obligations
      this.generateObligationsForLoan(data, loan.id, obligationCount);
    });

    // Generate sample evidence for some obligations
    this.generateSampleEvidence(data);

    this.saveData(data);
  }

  private generateObligationsForLoan(data: DemoDataStore, loanId: number, count: number): void {
    const sampleObligations = [
      {
        name: 'Quarterly Financial Statements',
        obligation_type: 'REPORTING',
        description: 'Deliver quarterly unaudited consolidated financial statements within 45 days after quarter-end.',
        party_responsible: 'Borrower',
        frequency: 'QUARTERLY',
        due_rule: 'Within 45 days after quarter-end'
      },
      {
        name: 'Annual Audited Financial Statements',
        obligation_type: 'REPORTING',
        description: 'Deliver annual audited consolidated financial statements within 90 days after year-end.',
        party_responsible: 'Borrower',
        frequency: 'ANNUAL',
        due_rule: 'Within 90 days after year-end'
      },
      {
        name: 'Debt Service Coverage Ratio',
        obligation_type: 'COVENANT',
        description: 'Maintain a minimum debt service coverage ratio of 1.25x.',
        party_responsible: 'Borrower',
        frequency: 'QUARTERLY',
        due_rule: 'Tested quarterly'
      },
      {
        name: 'Maximum Leverage Ratio',
        obligation_type: 'COVENANT',
        description: 'Maintain total debt to EBITDA ratio not exceeding 3.0x.',
        party_responsible: 'Borrower',
        frequency: 'QUARTERLY',
        due_rule: 'Tested quarterly'
      },
      {
        name: 'Insurance Certificate',
        obligation_type: 'INFORMATION',
        description: 'Provide evidence of property and casualty insurance coverage.',
        party_responsible: 'Borrower',
        frequency: 'ANNUAL',
        due_rule: 'Before policy expiration'
      },
      {
        name: 'Material Adverse Change Notice',
        obligation_type: 'NOTICE',
        description: 'Notify lender of any material adverse changes within 5 business days.',
        party_responsible: 'Borrower',
        frequency: 'AD_HOC',
        due_rule: 'Within 5 business days of occurrence'
      },
      {
        name: 'Compliance Certificate',
        obligation_type: 'REPORTING',
        description: 'Submit quarterly compliance certificate with covenant calculations.',
        party_responsible: 'Borrower',
        frequency: 'QUARTERLY',
        due_rule: 'With quarterly financial statements'
      },
      {
        name: 'Board Resolutions',
        obligation_type: 'INFORMATION',
        description: 'Provide certified copies of board resolutions authorizing the loan.',
        party_responsible: 'Borrower',
        frequency: 'ONCE',
        due_rule: 'At closing'
      },
      {
        name: 'Environmental Compliance Report',
        obligation_type: 'REPORTING',
        description: 'Submit annual environmental compliance report.',
        party_responsible: 'Borrower',
        frequency: 'ANNUAL',
        due_rule: 'Within 120 days after year-end'
      },
      {
        name: 'Key Person Insurance',
        obligation_type: 'COVENANT',
        description: 'Maintain key person life insurance of at least $1M on CEO.',
        party_responsible: 'Borrower',
        frequency: 'ANNUAL',
        due_rule: 'Maintain continuously'
      },
      {
        name: 'Monthly Cash Flow Report',
        obligation_type: 'REPORTING',
        description: 'Provide monthly cash flow statements within 15 days of month-end.',
        party_responsible: 'Borrower',
        frequency: 'MONTHLY',
        due_rule: 'Within 15 days of month-end'
      },
      {
        name: 'Litigation Notice',
        obligation_type: 'NOTICE',
        description: 'Notify lender of any litigation exceeding $100K within 10 days.',
        party_responsible: 'Borrower',
        frequency: 'AD_HOC',
        due_rule: 'Within 10 days of service'
      }
    ];

    const statuses: ObligationStatus[] = ['ON_TRACK', 'DUE_SOON', 'OVERDUE', 'COMPLETED'];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const template = sampleObligations[i % sampleObligations.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Generate realistic due dates based on status
      let nextDueAt: string | null = null;
      if (status !== 'COMPLETED') {
        const daysOffset = this.getDaysOffsetForStatus(status);
        nextDueAt = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000).toISOString();
      }

      const obligation: Obligation = {
        id: data.nextIds.obligation++,
        loan_id: loanId,
        name: `${template.name}${i > sampleObligations.length - 1 ? ` (${Math.floor(i / sampleObligations.length) + 1})` : ''}`,
        obligation_type: template.obligation_type,
        description: template.description,
        party_responsible: template.party_responsible,
        frequency: template.frequency,
        due_date: nextDueAt ? nextDueAt.split('T')[0] : null,
        due_rule: template.due_rule,
        next_due_at: nextDueAt,
        status: status,
        confidence: Math.random() > 0.3 ? Math.round((0.7 + Math.random() * 0.3) * 100) / 100 : null, // 70-100% confidence or null
        source_excerpt: Math.random() > 0.5 ? `"${template.description.substring(0, 50)}..."` : null,
        source_page: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 1 : null,
        created_at: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Created within last 7 days
        updated_at: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() // Updated within last 2 days
      };

      data.obligations.push(obligation);
    }
  }

  private getDaysOffsetForStatus(status: ObligationStatus): number {
    switch (status) {
      case 'OVERDUE':
        return -Math.floor(Math.random() * 30) - 1; // 1-30 days overdue
      case 'DUE_SOON':
        return Math.floor(Math.random() * 7) + 1; // 1-7 days from now
      case 'ON_TRACK':
        return Math.floor(Math.random() * 60) + 8; // 8-67 days from now
      case 'COMPLETED':
        return 0; // Not used for completed
      default:
        return 30;
    }
  }

  private generateSampleEvidence(data: DemoDataStore): void {
    // Add evidence to at least 3 random obligations
    const obligationsWithEvidence = data.obligations
      .filter(o => Math.random() > 0.7) // Randomly select ~30% of obligations
      .slice(0, Math.max(3, Math.floor(data.obligations.length * 0.3))); // At least 3, up to 30%

    const sampleFilenames = [
      'Q3_2024_Financial_Statements.pdf',
      'Insurance_Certificate_2024.pdf',
      'Compliance_Certificate_Q3.pdf',
      'Board_Resolution_Loan_Authorization.pdf',
      'Environmental_Report_2024.pdf',
      'Cash_Flow_Statement_October.xlsx',
      'Audit_Report_2023.pdf',
      'Key_Person_Insurance_Policy.pdf'
    ];

    obligationsWithEvidence.forEach(obligation => {
      const evidenceCount = Math.floor(Math.random() * 3) + 1; // 1-3 pieces of evidence per obligation
      
      for (let i = 0; i < evidenceCount; i++) {
        const filename = sampleFilenames[Math.floor(Math.random() * sampleFilenames.length)];
        const evidence: Evidence = {
          id: data.nextIds.evidence++,
          obligation_id: obligation.id,
          filename: filename,
          file_path: `/demo/evidence/${filename}`,
          uploaded_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(), // Uploaded within last 14 days
          note: Math.random() > 0.5 ? this.generateEvidenceNote() : null
        };
        
        data.evidence.push(evidence);
      }
    });
  }

  private generateEvidenceNote(): string {
    const notes = [
      'Submitted as required by loan agreement',
      'Updated version with latest figures',
      'Certified by external auditor',
      'Includes all required schedules',
      'Reviewed and approved by board',
      'Meets all covenant requirements',
      'Filed with regulatory authorities'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
}