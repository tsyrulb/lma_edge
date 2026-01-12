import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { MockDataService } from './services/mock-data.service';

describe('ApiService Demo Mode Integration', () => {
  let service: ApiService;
  let mockDataService: MockDataService;
  let httpMock: HttpTestingController;
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

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, MockDataService]
    });

    service = TestBed.inject(ApiService);
    mockDataService = TestBed.inject(MockDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('Demo Mode Toggle', () => {
    it('should route to mock service when demo mode is enabled', async () => {
      service.enableDemoMode();
      expect(service.isDemoMode()).toBe(true);

      // Call a method that should use mock service
      const loans = await service.listLoans();
      
      // Should get data from mock service, not make HTTP request
      expect(Array.isArray(loans)).toBe(true);
      expect(loans.length).toBeGreaterThan(0);
      
      // Verify no HTTP requests were made
      httpMock.expectNone(() => true);
    });

    it('should route to HTTP service when demo mode is disabled', async () => {
      service.disableDemoMode();
      expect(service.isDemoMode()).toBe(false);

      // Call a method that should use HTTP service
      const loansPromise = service.listLoans();
      
      // Should make HTTP request
      const req = httpMock.expectOne(`${service.baseUrl}/loans`);
      expect(req.request.method).toBe('GET');
      
      // Respond with mock data
      req.flush([{ id: 1, title: 'HTTP Test Loan', created_at: '2024-01-01T00:00:00Z' }]);
      
      const loans = await loansPromise;
      expect(loans.length).toBe(1);
      expect(loans[0].title).toBe('HTTP Test Loan');
    });

    it('should persist demo mode state', () => {
      service.enableDemoMode();
      
      // Create new service instance
      const newService = TestBed.inject(ApiService);
      expect(newService.isDemoMode()).toBe(true);
    });

    it('should reset demo data', async () => {
      service.enableDemoMode();
      
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

  describe('GitHub Pages Auto-Detection', () => {
    it('should auto-enable demo mode on GitHub Pages', () => {
      // First disable demo mode to ensure clean state
      service.disableDemoMode();
      
      // Mock GitHub Pages hostname
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { hostname: 'username.github.io' },
        writable: true
      });

      // Create new TestBed with fresh service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [ApiService, MockDataService]
      });

      const githubService = TestBed.inject(ApiService);
      expect(githubService.isDemoMode()).toBe(true);
      
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });

    it('should not auto-enable demo mode on other hostnames', () => {
      // Mock regular hostname
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });

      // Create new TestBed with fresh service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [ApiService, MockDataService]
      });

      const localService = TestBed.inject(ApiService);
      expect(localService.isDemoMode()).toBe(false);
      
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });
  });

  describe('API Method Routing', () => {
    beforeEach(() => {
      service.enableDemoMode();
    });

    it('should route health check to mock service', async () => {
      const health = await service.health();
      expect(health.status).toBe('ok');
      
      // Verify no HTTP requests
      httpMock.expectNone(() => true);
    });

    it('should route loan operations to mock service', async () => {
      // Test create
      const loan = await service.createLoan('Demo Loan');
      expect(loan.title).toBe('Demo Loan');
      
      // Test list
      const loans = await service.listLoans();
      expect(loans.find(l => l.id === loan.id)).toBeDefined();
      
      // Test get
      const loanDetail = await service.getLoan(loan.id);
      expect(loanDetail.id).toBe(loan.id);
      
      // Verify no HTTP requests
      httpMock.expectNone(() => true);
    });

    it('should route obligation operations to mock service', async () => {
      const loans = await service.listLoans();
      const loanId = loans[0].id;
      
      // Test create
      const obligation = await service.createObligation(loanId, {
        name: 'Test Obligation',
        obligation_type: 'REPORTING'
      });
      expect(obligation.name).toBe('Test Obligation');
      
      // Test list
      const obligations = await service.listObligations(loanId);
      expect(obligations.find(o => o.id === obligation.id)).toBeDefined();
      
      // Test update
      const updated = await service.updateObligation(obligation.id, { name: 'Updated' });
      expect(updated.name).toBe('Updated');
      
      // Test complete
      const completed = await service.completeObligation(obligation.id);
      expect(completed.status).toBe('COMPLETED');
      
      // Test reopen
      const reopened = await service.reopenObligation(obligation.id);
      expect(reopened.status).toBe('ON_TRACK');
      
      // Verify no HTTP requests
      httpMock.expectNone(() => true);
    });

    it('should route evidence operations to mock service', async () => {
      const loans = await service.listLoans();
      const obligations = await service.listObligations(loans[0].id);
      const obligationId = obligations[0].id;
      
      // Test upload
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const evidence = await service.uploadEvidence(obligationId, file, 'Test note');
      expect(evidence.filename).toBe('test.pdf');
      
      // Test list
      const evidenceList = await service.listEvidence(obligationId);
      expect(evidenceList.find(e => e.id === evidence.id)).toBeDefined();
      
      // Verify no HTTP requests
      httpMock.expectNone(() => true);
    });
  });
});