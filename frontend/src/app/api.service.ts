import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuditEvent, Evidence, Loan, LoanDetail, Obligation } from './api.models';
import { MockDataService } from './services/mock-data.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly defaultBaseUrl = 'http://localhost:8000/api';

  constructor(
    private readonly http: HttpClient,
    private readonly mockDataService: MockDataService
  ) {
    // Auto-enable demo mode on GitHub Pages
    if (this.isGitHubPages()) {
      this.mockDataService.enableDemoMode();
    }
  }

  get baseUrl(): string {
    return localStorage.getItem('api.baseUrl') ?? this.defaultBaseUrl;
  }

  set baseUrl(url: string) {
    localStorage.setItem('api.baseUrl', url);
  }

  private isGitHubPages(): boolean {
    const hostname = window.location.hostname;
    // Check for GitHub Pages hostnames
    return hostname.includes('github.io') || 
           hostname.includes('github.com') ||
           // Check for custom domains that might be used with GitHub Pages
           // by checking if we're on HTTPS and there's no backend available
           (window.location.protocol === 'https:' && 
            !hostname.includes('localhost') && 
            !hostname.includes('127.0.0.1') &&
            !hostname.includes('dev') &&
            !hostname.includes('staging'));
  }

  health(): Promise<{ status: string }> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.health();
    }
    return firstValueFrom(this.http.get<{ status: string }>(`${this.baseUrl}/health`));
  }

  listLoans(): Promise<Loan[]> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.listLoans();
    }
    return firstValueFrom(this.http.get<Loan[]>(`${this.baseUrl}/loans`));
  }

  createLoan(title: string): Promise<Loan> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.createLoan(title);
    }
    return firstValueFrom(this.http.post<Loan>(`${this.baseUrl}/loans`, { title }));
  }

  getLoan(loanId: number): Promise<LoanDetail> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.getLoan(loanId);
    }
    return firstValueFrom(this.http.get<LoanDetail>(`${this.baseUrl}/loans/${loanId}`));
  }

  importText(loanId: number, text: string): Promise<Loan> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.importText(loanId, text);
    }
    return firstValueFrom(
      this.http.post<Loan>(`${this.baseUrl}/loans/${loanId}/import-text`, { text }),
    );
  }

  extract(loanId: number, text?: string): Promise<{ obligations: Obligation[] }> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.extract(loanId, text);
    }
    return firstValueFrom(
      this.http.post<{ obligations: Obligation[] }>(`${this.baseUrl}/loans/${loanId}/extract`, {
        text: text ?? null,
      }),
    );
  }

  listObligations(loanId: number): Promise<Obligation[]> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.listObligations(loanId);
    }
    return firstValueFrom(
      this.http.get<Obligation[]>(`${this.baseUrl}/loans/${loanId}/obligations`),
    );
  }

  createObligation(loanId: number, payload: Partial<Obligation>): Promise<Obligation> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.createObligation(loanId, payload);
    }
    return firstValueFrom(
      this.http.post<Obligation>(`${this.baseUrl}/loans/${loanId}/obligations`, payload),
    );
  }

  updateObligation(obligationId: number, payload: Partial<Obligation>): Promise<Obligation> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.updateObligation(obligationId, payload);
    }
    return firstValueFrom(
      this.http.put<Obligation>(`${this.baseUrl}/obligations/${obligationId}`, payload),
    );
  }

  completeObligation(obligationId: number): Promise<Obligation> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.completeObligation(obligationId);
    }
    return firstValueFrom(
      this.http.post<Obligation>(`${this.baseUrl}/obligations/${obligationId}/complete`, {}),
    );
  }

  reopenObligation(obligationId: number): Promise<Obligation> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.reopenObligation(obligationId);
    }
    return firstValueFrom(
      this.http.post<Obligation>(`${this.baseUrl}/obligations/${obligationId}/reopen`, {}),
    );
  }

  deleteObligation(obligationId: number): Promise<{ deleted: boolean }> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.deleteObligation(obligationId);
    }
    return firstValueFrom(
      this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/obligations/${obligationId}`),
    );
  }

  listEvidence(obligationId: number): Promise<Evidence[]> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.listEvidence(obligationId);
    }
    return firstValueFrom(
      this.http.get<Evidence[]>(`${this.baseUrl}/obligations/${obligationId}/evidence`),
    );
  }

  uploadEvidence(obligationId: number, file: File, note?: string): Promise<Evidence> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.uploadEvidence(obligationId, file, note);
    }
    const form = new FormData();
    form.append('file', file);
    if (note) form.append('note', note);
    return firstValueFrom(
      this.http.post<Evidence>(`${this.baseUrl}/obligations/${obligationId}/evidence`, form),
    );
  }

  listAudit(loanId?: number, obligationId?: number): Promise<AuditEvent[]> {
    if (this.mockDataService.isDemoMode()) {
      return this.mockDataService.listAudit(loanId, obligationId);
    }
    const params = new URLSearchParams();
    if (loanId != null) params.set('loan_id', String(loanId));
    if (obligationId != null) params.set('obligation_id', String(obligationId));
    const qs = params.toString();
    return firstValueFrom(
      this.http.get<AuditEvent[]>(`${this.baseUrl}/audit${qs ? `?${qs}` : ''}`),
    );
  }

  // Demo mode control methods
  enableDemoMode(): void {
    this.mockDataService.enableDemoMode();
  }

  disableDemoMode(): void {
    this.mockDataService.disableDemoMode();
  }

  isDemoMode(): boolean {
    return this.mockDataService.isDemoMode();
  }

  resetDemoData(): void {
    this.mockDataService.resetDemoData();
  }

  getEnvironmentInfo(): { isStaticHosting: boolean; hostname: string; protocol: string; isDemoMode: boolean } {
    return this.mockDataService.getEnvironmentInfo();
  }
}

