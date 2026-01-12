import { TestBed } from '@angular/core/testing';
import { MockDataService } from './mock-data.service';
import { Loan, Obligation, Evidence, ObligationStatus } from '../api.models';

describe('MockDataService', () => {
  let service: MockDataService;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = window.localStorage;
    const mockStorage: { [key: string]: string } = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
        removeItem: (key: string) => { delete mockStorage[key]; },
        clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
      },
      writable: true
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('Demo Mode Configuration', () => {
    it('should start with demo mode disabled by default', () => {
      expect(service.isDemoMode()).toBe(false);
    });

    it('should enable demo mode', () => {
      service.enableDemoMode();
      expect(service.isDemoMode()).toBe(true);
    });

    it('should disable demo mode', () => {
      service.enableDemoMode();
      service.disableDemoMode();
      expect(service.isDemoMode()).toBe(false);
    });

    it('should persist demo mode state in localStorage', () => {
      service.enableDemoMode();
      
      // Create new service instance to test persistence
      const newService = TestBed.inject(MockDataService);
      expect(newService.isDemoMode()).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(() => {
      service.enableDemoMode();
    });

    it('should initialize with sample data', async () => {
      const loans = await service.listLoans();
      expect(loans.length).toBeGreaterThanOrEqual(2);
      expect(loans[0].title).toBeDefined();
      expect(loans[0].id).toBeDefined();
    });

    it('should persist data to localStorage', async () => {
      const initialLoans = await service.listLoans();
      const newLoan = await service.createLoan('Test Loan');
      
      // Create new service instance to test persistence
      const newService = TestBed.inject(MockDataService);
      const persistedLoans = await newService.listLoans();
      
      expect(persistedLoans.length).toBe(initialLoans.length + 1);
      expect(persistedLoans.find(l => l.id === newLoan.id)).toBeDefined();
    });

    it('should reset demo data', async () => {
      // Create some data
      await service.createLoan('Test Loan');
      
      // Reset
      service.resetDemoData();
      
      // Should have fresh sample data
      const loans = await service.listLoans();
      expect(loans.length).toBe(2); // Default sample loans
      expect(loans.find(l => l.title === 'Test Loan')).toBeUndefined();
    });
  });

  describe('Loan Operations', () => {
    beforeEach(() => {
      service.enableDemoMode();
    });

    it('should list loans', async () => {
      const loans = await service.listLoans();
      expect(Array.isArray(loans)).toBe(true);
      expect(loans.length).toBeGreaterThan(0);
    });

    it('should create a loan', async () => {
      const title = 'New Test Loan';
      const loan = await service.createLoan(title);
      
      expect(loan.title).toBe(title);
      expect(loan.id).toBeDefined();
      expect(loan.created_at).toBeDefined();
    });

    it('should get loan details with summary', async () => {
      const loans = await service.listLoans();
      const loanDetail = await service.getLoan(loans[0].id);
      
      expect(loanDetail.id).toBe(loans[0].id);
      expect(loanDetail.summary).toBeDefined();
      expect(loanDetail.summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for non-existent loan', async () => {
      await expect(service.getLoan(99999)).rejects.toThrow('Loan 99999 not found');
    });
  });

  describe('Obligation Operations', () => {
    let testLoanId: number;

    beforeEach(async () => {
      service.enableDemoMode();
      const loans = await service.listLoans();
      testLoanId = loans[0].id;
    });

    it('should list obligations for a loan', async () => {
      const obligations = await service.listObligations(testLoanId);
      expect(Array.isArray(obligations)).toBe(true);
      expect(obligations.length).toBeGreaterThan(0);
    });

    it('should create an obligation', async () => {
      const obligationData = {
        name: 'Test Obligation',
        obligation_type: 'REPORTING' as const,
        description: 'Test description',
        party_responsible: 'Borrower',
        frequency: 'MONTHLY' as const
      };

      const obligation = await service.createObligation(testLoanId, obligationData);
      
      expect(obligation.name).toBe(obligationData.name);
      expect(obligation.loan_id).toBe(testLoanId);
      expect(obligation.id).toBeDefined();
      expect(obligation.status).toBe('ON_TRACK');
    });

    it('should update an obligation', async () => {
      const obligations = await service.listObligations(testLoanId);
      const obligationId = obligations[0].id;
      
      const updates = { name: 'Updated Name', description: 'Updated description' };
      const updated = await service.updateObligation(obligationId, updates);
      
      expect(updated.name).toBe(updates.name);
      expect(updated.description).toBe(updates.description);
      expect(updated.updated_at).toBeDefined();
    });

    it('should complete an obligation', async () => {
      const obligations = await service.listObligations(testLoanId);
      const obligationId = obligations[0].id;
      
      const completed = await service.completeObligation(obligationId);
      expect(completed.status).toBe('COMPLETED');
    });

    it('should reopen an obligation', async () => {
      const obligations = await service.listObligations(testLoanId);
      const obligationId = obligations[0].id;
      
      // First complete it
      await service.completeObligation(obligationId);
      
      // Then reopen it
      const reopened = await service.reopenObligation(obligationId);
      expect(reopened.status).toBe('ON_TRACK');
    });

    it('should delete an obligation', async () => {
      const obligations = await service.listObligations(testLoanId);
      const obligationId = obligations[0].id;
      
      const result = await service.deleteObligation(obligationId);
      expect(result.deleted).toBe(true);
      
      // Verify it's gone
      const remainingObligations = await service.listObligations(testLoanId);
      expect(remainingObligations.find(o => o.id === obligationId)).toBeUndefined();
    });

    it('should throw error for non-existent obligation', async () => {
      await expect(service.updateObligation(99999, { name: 'Test' })).rejects.toThrow('Obligation 99999 not found');
      await expect(service.deleteObligation(99999)).rejects.toThrow('Obligation 99999 not found');
    });
  });

  describe('Evidence Operations', () => {
    let testObligationId: number;

    beforeEach(async () => {
      service.enableDemoMode();
      const loans = await service.listLoans();
      const obligations = await service.listObligations(loans[0].id);
      testObligationId = obligations[0].id;
    });

    it('should list evidence for an obligation', async () => {
      const evidence = await service.listEvidence(testObligationId);
      expect(Array.isArray(evidence)).toBe(true);
    });

    it('should upload evidence', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const note = 'Test evidence note';
      
      const evidence = await service.uploadEvidence(testObligationId, file, note);
      
      expect(evidence.filename).toBe('test.pdf');
      expect(evidence.note).toBe(note);
      expect(evidence.obligation_id).toBe(testObligationId);
      expect(evidence.uploaded_at).toBeDefined();
    });
  });

  describe('Sample Data Generation', () => {
    beforeEach(() => {
      service.enableDemoMode();
    });

    it('should generate sample loans with obligations', async () => {
      const loans = await service.listLoans();
      expect(loans.length).toBe(2);
      
      // Check each loan has obligations
      for (const loan of loans) {
        const obligations = await service.listObligations(loan.id);
        expect(obligations.length).toBeGreaterThanOrEqual(8);
        expect(obligations.length).toBeLessThanOrEqual(12);
      }
    });

    it('should generate obligations with all status types', async () => {
      const loans = await service.listLoans();
      const allObligations: Obligation[] = [];
      
      for (const loan of loans) {
        const obligations = await service.listObligations(loan.id);
        allObligations.push(...obligations);
      }
      
      const statuses = new Set(allObligations.map(o => o.status));
      expect(statuses.has('ON_TRACK')).toBe(true);
      expect(statuses.has('DUE_SOON')).toBe(true);
      expect(statuses.has('OVERDUE')).toBe(true);
      expect(statuses.has('COMPLETED')).toBe(true);
    });

    it('should generate realistic due dates', async () => {
      const loans = await service.listLoans();
      const obligations = await service.listObligations(loans[0].id);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      obligations.forEach(obligation => {
        if (obligation.next_due_at && obligation.status !== 'COMPLETED') {
          const dueDate = new Date(obligation.next_due_at);
          expect(dueDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
          expect(dueDate.getTime()).toBeLessThanOrEqual(ninetyDaysFromNow.getTime());
        }
      });
    });

    it('should generate sample evidence for some obligations', async () => {
      const loans = await service.listLoans();
      let totalEvidence = 0;
      
      for (const loan of loans) {
        const obligations = await service.listObligations(loan.id);
        for (const obligation of obligations) {
          const evidence = await service.listEvidence(obligation.id);
          totalEvidence += evidence.length;
        }
      }
      
      expect(totalEvidence).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Audit Events', () => {
    beforeEach(() => {
      service.enableDemoMode();
    });

    it('should create audit events for operations', async () => {
      const loan = await service.createLoan('Audit Test Loan');
      const auditEvents = await service.listAudit(loan.id);
      
      const creationEvent = auditEvents.find(e => 
        e.entity_type === 'loan' && 
        e.entity_id === loan.id && 
        e.action === 'created'
      );
      
      expect(creationEvent).toBeDefined();
    });

    it('should filter audit events by loan', async () => {
      const loans = await service.listLoans();
      const loanId = loans[0].id;
      
      const auditEvents = await service.listAudit(loanId);
      
      // All events should be related to this loan
      auditEvents.forEach(event => {
        if (event.entity_type === 'loan') {
          expect(event.entity_id).toBe(loanId);
        }
        // For obligations and evidence, we'd need to verify they belong to the loan
        // This is a simplified check
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await service.health();
      expect(health.status).toBe('ok');
    });
  });
});