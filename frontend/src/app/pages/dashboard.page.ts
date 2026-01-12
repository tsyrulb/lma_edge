import { CommonModule } from '@angular/common';
import { Component, computed, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Loan, Obligation } from '../api.models';
import { ApiService } from '../api.service';
import { StatusBadgeComponent } from '../components/status-badge.component';
import { DateFormatterPipe } from '../utils/date-formatter.pipe';
import { LoadingSpinnerComponent } from '../components/loading-spinner.component';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent, DateFormatterPipe, LoadingSpinnerComponent],
  styles: [`
    .overdue-row {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
    }
    .overdue-row:hover {
      background-color: #fee2e2;
    }
    .error {
      border-color: #ef4444 !important;
      background-color: #fef2f2;
    }
    .error-message {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }
  `],
  template: `
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <div class="row" style="justify-content: space-between;">
      <h2 style="margin: 0;">Dashboard</h2>
      <div class="row">
        <button class="primary" routerLink="/import" accesskey="n">
          New Loan / Import
          <span class="keyboard-shortcut">Alt+N</span>
        </button>
        <button routerLink="/demo" accesskey="d">
          Demo Data
          <span class="keyboard-shortcut">Alt+D</span>
        </button>
      </div>
    </div>

    <main id="main-content">
      <div class="card" style="margin-top: 14px;">
        <div class="row">
          <div style="min-width: 280px; flex: 1;">
            <label class="muted" for="loan-select">Loan</label>
            <select 
              id="loan-select"
              [value]="selectedLoanId()" 
              (change)="onLoanChange($event)"
              aria-label="Select a loan to view obligations">
              <option value="">Select a loan…</option>
              <option *ngFor="let l of loans()" [value]="l.id">{{ l.title }}</option>
            </select>
          </div>
          <div class="row" *ngIf="selectedLoanId() as id">
            <a [href]="api.baseUrl + '/loans/' + id + '/export.ics'" target="_blank"
              ><button accesskey="e">
                Export ICS
                <span class="keyboard-shortcut">Alt+E</span>
              </button></a
            >
            <a [href]="api.baseUrl + '/loans/' + id + '/compliance-packet'" target="_blank"
              ><button accesskey="c">
                Compliance Packet
                <span class="keyboard-shortcut">Alt+C</span>
              </button></a
            >
          </div>
        </div>
        <div style="margin-top: 10px;" *ngIf="loading()">
          <app-loading-spinner type="spinner" size="small" text="Loading..."></app-loading-spinner>
        </div>
        <div class="muted" style="margin-top: 10px;" *ngIf="error()" role="alert" aria-live="polite">{{ error() }}</div>
      </div>

      <!-- Summary Card -->
      <div *ngIf="selectedLoanId() && !loading()" class="card" style="margin-top: 14px;">
        <h3 style="margin-top: 0;">Summary</h3>
        <div class="grid four" style="gap: 16px;" role="region" aria-label="Obligation summary statistics">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;" aria-label="{{ obligations().length }} total obligations">{{ obligations().length }}</div>
            <div class="muted" style="font-size: 14px;">Total</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;" aria-label="{{ dueSoon().length }} obligations due soon">{{ dueSoon().length }}</div>
            <app-status-badge status="DUE_SOON" [showIcon]="false" size="small"></app-status-badge>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;" aria-label="{{ overdue().length }} overdue obligations">{{ overdue().length }}</div>
            <app-status-badge status="OVERDUE" [showIcon]="false" size="small"></app-status-badge>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;" aria-label="{{ onTrack().length }} obligations on track">{{ onTrack().length }}</div>
            <app-status-badge status="ON_TRACK" [showIcon]="false" size="small"></app-status-badge>
          </div>
        </div>
        <div class="grid one" style="margin-top: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;" aria-label="{{ completed().length }} completed obligations">{{ completed().length }}</div>
            <app-status-badge status="COMPLETED" [showIcon]="false" size="small"></app-status-badge>
          </div>
        </div>
      </div>

      <!-- Welcome Card -->
      <div *ngIf="!selectedLoanId() && !loading()" class="card" style="margin-top: 14px; text-align: center; padding: 40px 20px;">
        <h3 style="margin-top: 0; color: #666;">Welcome to CovenantOps</h3>
        <p style="margin-bottom: 24px; color: #888; font-size: 16px;">
          Track loan obligations, manage compliance, and generate reports with ease.
        </p>
        <div class="row" style="justify-content: center; gap: 12px;">
          <button class="primary" routerLink="/import" accesskey="n">
            Create New Loan
            <span class="keyboard-shortcut">Alt+N</span>
          </button>
          <button (click)="enableDemoMode()" [disabled]="enablingDemo()" accesskey="t">
            <span *ngIf="!enablingDemo()">Try Demo Mode</span>
            <span *ngIf="enablingDemo()">Loading Demo...</span>
            <span class="keyboard-shortcut" *ngIf="!enablingDemo()">Alt+T</span>
          </button>
        </div>
      </div>

      <div *ngIf="selectedLoanId() && !loading()" class="grid two" style="margin-top: 14px;">
        <div class="card">
          <h3 style="margin-top: 0;">Due Soon (14 days)</h3>
          <ng-container *ngIf="dueSoon().length; else emptyDueSoon">
            <table role="table" aria-label="Obligations due soon">
              <thead>
                <tr>
                  <th scope="col">Obligation</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of dueSoon(); trackBy: trackByObligationId">
                  <td>
                    <a [routerLink]="['/loans', o.loan_id, 'obligations', o.id]" [attr.aria-label]="'View details for ' + o.name">{{ o.name }}</a>
                  </td>
                  <td>{{ (o.next_due_at || o.due_date) | dateFormatter:'relative' }}</td>
                  <td><span class="pill {{ o.status }}" [attr.aria-label]="'Status: ' + o.status">{{ o.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #emptyDueSoon><div class="muted">Nothing due soon.</div></ng-template>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">Overdue</h3>
          <ng-container *ngIf="overdue().length; else emptyOverdue">
            <table role="table" aria-label="Overdue obligations">
              <thead>
                <tr>
                  <th scope="col">Obligation</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of overdue(); trackBy: trackByObligationId" class="overdue-row">
                  <td>
                    <a [routerLink]="['/loans', o.loan_id, 'obligations', o.id]" [attr.aria-label]="'View details for overdue obligation: ' + o.name">{{ o.name }}</a>
                  </td>
                  <td>{{ (o.next_due_at || o.due_date) | dateFormatter:'relative' }}</td>
                  <td><span class="pill {{ o.status }}" [attr.aria-label]="'Status: ' + o.status">{{ o.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #emptyOverdue><div class="muted">No overdue items.</div></ng-template>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">On Track</h3>
          <ng-container *ngIf="onTrack().length; else emptyOnTrack">
            <table role="table" aria-label="Obligations on track">
              <thead>
                <tr>
                  <th scope="col">Obligation</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of onTrack(); trackBy: trackByObligationId">
                  <td>
                    <a [routerLink]="['/loans', o.loan_id, 'obligations', o.id]" [attr.aria-label]="'View details for ' + o.name">{{ o.name }}</a>
                  </td>
                  <td>{{ (o.next_due_at || o.due_date) | dateFormatter:'relative' }}</td>
                  <td><span class="pill {{ o.status }}" [attr.aria-label]="'Status: ' + o.status">{{ o.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #emptyOnTrack><div class="muted">No on-track items.</div></ng-template>
        </div>

        <div class="card">
          <div class="row" style="justify-content: space-between;">
            <h3 style="margin-top: 0;">Completed</h3>
            <button (click)="showCompleted.set(!showCompleted())" [attr.aria-expanded]="showCompleted()" aria-controls="completed-obligations">
              {{ showCompleted() ? 'Hide' : 'Show' }} ({{ completed().length }})
            </button>
          </div>
          <div id="completed-obligations" [attr.aria-hidden]="!showCompleted()">
            <ng-container *ngIf="showCompleted()">
              <ng-container *ngIf="completed().length; else emptyCompleted">
                <table role="table" aria-label="Completed obligations">
                  <thead>
                    <tr>
                      <th scope="col">Obligation</th>
                      <th scope="col">Due</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let o of completed(); trackBy: trackByObligationId">
                      <td>
                        <a [routerLink]="['/loans', o.loan_id, 'obligations', o.id]" [attr.aria-label]="'View details for completed obligation: ' + o.name">{{ o.name }}</a>
                      </td>
                      <td>{{ (o.next_due_at || o.due_date) | dateFormatter:'relative' }}</td>
                      <td><span class="pill {{ o.status }}" [attr.aria-label]="'Status: ' + o.status">{{ o.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </ng-container>
              <ng-template #emptyCompleted><div class="muted">Nothing completed yet.</div></ng-template>
            </ng-container>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 14px;" *ngIf="selectedLoanId() && !loading()">
        <h3 style="margin-top: 0;">Add Manual Obligation</h3>
        <form (ngSubmit)="createManual()" #obligationForm="ngForm" role="form" aria-label="Add new obligation form">
          <div class="grid two">
            <div>
              <label class="muted" for="obligation-name">Name</label>
              <input 
                id="obligation-name"
                name="name"
                [(ngModel)]="manual.name" 
                placeholder="e.g., Deliver quarterly statements"
                [class.error]="validationErrors()['name']"
                (input)="clearValidationError('name')"
                aria-describedby="name-error"
                required
              />
              <div id="name-error" class="error-message" *ngIf="validationErrors()['name']" role="alert">
                {{ validationErrors()['name'] }}
              </div>
            </div>
            <div>
              <label class="muted" for="party-responsible">Party responsible</label>
              <input 
                id="party-responsible"
                name="party_responsible"
                [(ngModel)]="manual.party_responsible" 
                placeholder="Borrower" 
              />
            </div>
          </div>

          <div style="height: 10px;"></div>
          <div class="grid two">
            <div>
              <label class="muted" for="obligation-type">Type</label>
              <select id="obligation-type" name="obligation_type" [(ngModel)]="manual.obligation_type">
                <option *ngFor="let t of obligationTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="muted" for="frequency">Frequency</label>
              <select id="frequency" name="frequency" [(ngModel)]="manual.frequency">
                <option *ngFor="let f of frequencies" [value]="f">{{ f }}</option>
              </select>
            </div>
          </div>

          <div style="height: 10px;"></div>
          <div class="grid two">
            <div>
              <label class="muted" for="due-date">Due date (YYYY-MM-DD)</label>
              <input 
                id="due-date"
                name="due_date"
                [(ngModel)]="manual.due_date" 
                placeholder="2026-01-15"
                [class.error]="validationErrors()['due_date']"
                (input)="clearValidationError('due_date')"
                aria-describedby="due-date-error"
              />
              <div id="due-date-error" class="error-message" *ngIf="validationErrors()['due_date']" role="alert">
                {{ validationErrors()['due_date'] }}
              </div>
            </div>
            <div>
              <label class="muted" for="next-due-at">Next due at (ISO)</label>
              <input 
                id="next-due-at"
                name="next_due_at"
                [(ngModel)]="manual.next_due_at" 
                placeholder="2026-01-15T12:00:00"
                [class.error]="validationErrors()['next_due_at']"
                (input)="clearValidationError('next_due_at')"
                aria-describedby="next-due-at-error"
              />
              <div id="next-due-at-error" class="error-message" *ngIf="validationErrors()['next_due_at']" role="alert">
                {{ validationErrors()['next_due_at'] }}
              </div>
            </div>
          </div>

          <div style="height: 10px;"></div>
          <label class="muted" for="due-rule">Due rule</label>
          <input id="due-rule" name="due_rule" [(ngModel)]="manual.due_rule" placeholder="Within 45 days after quarter-end" />

          <div style="height: 10px;"></div>
          <label class="muted" for="description">Description</label>
          <textarea id="description" name="description" [(ngModel)]="manual.description"></textarea>

          <div class="row" style="margin-top: 10px;">
            <button type="submit" class="primary" [disabled]="creatingManual()" accesskey="s">
              <span *ngIf="!creatingManual()">Add obligation</span>
              <span *ngIf="creatingManual()">Creating...</span>
              <span class="keyboard-shortcut" *ngIf="!creatingManual()">Alt+S</span>
            </button>
            <button type="button" (click)="resetManual()" [disabled]="creatingManual()" accesskey="r">
              Reset
              <span class="keyboard-shortcut">Alt+R</span>
            </button>
          </div>
          <div class="muted" style="margin-top: 10px;" *ngIf="manualError()" role="alert" aria-live="polite">{{ manualError() }}</div>
        </form>
      </div>
    </main>
  `,
})
export class DashboardPage {
  loans = signal<Loan[]>([]);
  obligations = signal<Obligation[]>([]);
  selectedLoanId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  showCompleted = signal(false);
  creatingManual = signal(false);
  manualError = signal<string | null>(null);
  enablingDemo = signal(false);
  validationErrors = signal<Record<string, string>>({});

  dueSoon = computed(() => this.obligations().filter((o) => o.status === 'DUE_SOON'));
  overdue = computed(() => this.obligations().filter((o) => o.status === 'OVERDUE'));
  onTrack = computed(() => this.obligations().filter((o) => o.status === 'ON_TRACK'));
  completed = computed(() => this.obligations().filter((o) => o.status === 'COMPLETED'));

  obligationTypes = ['REPORTING', 'COVENANT', 'NOTICE', 'INFORMATION', 'EVENT'];
  frequencies = [
    'ONCE',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMI_ANNUAL',
    'ANNUAL',
    'AD_HOC',
  ];

  manual: {
    name: string;
    obligation_type: string;
    frequency: string;
    due_date: string;
    next_due_at: string;
    due_rule: string;
    party_responsible: string;
    description: string;
  } = {
    name: '',
    obligation_type: 'REPORTING',
    frequency: 'ONCE',
    due_date: '',
    next_due_at: '',
    due_rule: '',
    party_responsible: 'Borrower',
    description: '',
  };

  constructor(public readonly api: ApiService, private readonly toastService: ToastService) {
    void this.refreshLoans();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Only handle shortcuts when Alt key is pressed and not in input fields
    if (!event.altKey || this.isInputFocused()) return;

    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        // Navigate to import page
        window.location.href = '/import';
        break;
      case 'd':
        event.preventDefault();
        // Navigate to demo page
        window.location.href = '/demo';
        break;
      case 'e':
        if (this.selectedLoanId()) {
          event.preventDefault();
          // Export ICS
          window.open(`${this.api.baseUrl}/loans/${this.selectedLoanId()}/export.ics`, '_blank');
        }
        break;
      case 'c':
        if (this.selectedLoanId()) {
          event.preventDefault();
          // Compliance packet
          window.open(`${this.api.baseUrl}/loans/${this.selectedLoanId()}/compliance-packet`, '_blank');
        }
        break;
      case 't':
        if (!this.selectedLoanId() && !this.enablingDemo()) {
          event.preventDefault();
          this.enableDemoMode();
        }
        break;
      case 's':
        if (this.selectedLoanId()) {
          event.preventDefault();
          this.createManual();
        }
        break;
      case 'r':
        if (this.selectedLoanId()) {
          event.preventDefault();
          this.resetManual();
        }
        break;
    }
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || 
           activeElement?.tagName === 'TEXTAREA' || 
           activeElement?.tagName === 'SELECT';
  }

  trackByObligationId(index: number, obligation: Obligation): number {
    return obligation.id;
  }

  async refreshLoans(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const loans = await this.api.listLoans();
      this.loans.set(loans);
      if (this.selectedLoanId() == null && loans.length) {
        this.selectedLoanId.set(loans[0].id);
        await this.loadObligations(loans[0].id);
      }
      if (loans.length > 0) {
        this.toastService.success('Loans loaded successfully');
      }
    } catch (e: any) {
      const errorMessage = e?.message ?? 'Failed to load loans';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  async onLoanChange(evt: Event): Promise<void> {
    const value = (evt.target as HTMLSelectElement).value;
    const id = value ? Number(value) : null;
    this.selectedLoanId.set(id);
    this.obligations.set([]);
    if (id == null) return;

    await this.loadObligations(id);
  }

  private async loadObligations(loanId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const obligations = await this.api.listObligations(loanId);
      this.obligations.set(obligations);
      this.toastService.success(`Loaded ${obligations.length} obligations`);
    } catch (e: any) {
      const errorMessage = e?.message ?? 'Failed to load obligations';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  resetManual(): void {
    this.manualError.set(null);
    this.validationErrors.set({});
    this.manual = {
      name: '',
      obligation_type: 'REPORTING',
      frequency: 'ONCE',
      due_date: '',
      next_due_at: '',
      due_rule: '',
      party_responsible: 'Borrower',
      description: '',
    };
  }

  async enableDemoMode(): Promise<void> {
    this.enablingDemo.set(true);
    try {
      // Check if ApiService has a method to enable demo mode
      if ('enableDemoMode' in this.api && typeof this.api.enableDemoMode === 'function') {
        (this.api as any).enableDemoMode();
      }
      await this.refreshLoans();
      this.toastService.success('Demo mode enabled! Sample data loaded.');
    } catch (e: any) {
      this.toastService.error('Failed to enable demo mode');
    } finally {
      this.enablingDemo.set(false);
    }
  }

  validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};

    // Name validation
    if (!this.manual.name.trim()) {
      errors['name'] = 'Name is required';
    }

    // Due date validation (if provided)
    if (this.manual.due_date.trim()) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(this.manual.due_date.trim())) {
        errors['due_date'] = 'Use YYYY-MM-DD format';
      } else {
        const date = new Date(this.manual.due_date.trim());
        if (isNaN(date.getTime())) {
          errors['due_date'] = 'Invalid date';
        }
      }
    }

    // Next due at validation (if provided)
    if (this.manual.next_due_at.trim()) {
      const date = new Date(this.manual.next_due_at.trim());
      if (isNaN(date.getTime())) {
        errors['next_due_at'] = 'Invalid datetime format';
      }
    }

    return errors;
  }

  focusFirstInvalidField(errors: Record<string, string>): void {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }
  }

  clearValidationError(field: string): void {
    const current = this.validationErrors();
    if (current[field]) {
      const updated = { ...current };
      delete updated[field];
      this.validationErrors.set(updated);
    }
  }

  async createManual(): Promise<void> {
    const loanId = this.selectedLoanId();
    if (loanId == null) return;

    this.manualError.set(null);
    
    // Validate form
    const errors = this.validateForm();
    this.validationErrors.set(errors);
    
    if (Object.keys(errors).length > 0) {
      this.focusFirstInvalidField(errors);
      this.toastService.error('Please fix the validation errors');
      return;
    }

    this.creatingManual.set(true);
    try {
      await this.api.createObligation(loanId, {
        name: this.manual.name.trim(),
        obligation_type: this.manual.obligation_type,
        frequency: this.manual.frequency,
        due_rule: this.manual.due_rule.trim() || null,
        due_date: this.manual.due_date.trim() || null,
        next_due_at: this.manual.next_due_at.trim() || null,
        party_responsible: this.manual.party_responsible.trim() || '',
        description: this.manual.description.trim() || '',
      });
      this.resetManual();
      await this.loadObligations(loanId);
      this.toastService.success('Obligation created successfully');
    } catch (e: any) {
      const errorMessage = e?.message ?? 'Failed to create obligation';
      this.manualError.set(errorMessage);
      this.toastService.error(errorMessage);
    } finally {
      this.creatingManual.set(false);
    }
  }
}
