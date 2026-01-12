import { CommonModule } from '@angular/common';
import { Component, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuditEvent, Evidence, LoanDetail, Obligation } from '../api.models';
import { ApiService } from '../api.service';
import { ToastService } from '../services/toast.service';
import { formatDate } from '../utils/date-formatter';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb" style="margin-bottom: 20px;" *ngIf="loan()" role="navigation" aria-label="Breadcrumb">
      <a [routerLink]="['/']" class="breadcrumb-item">Dashboard</a>
      <span class="breadcrumb-separator">></span>
      <a [routerLink]="['/loans', loanId()]" class="breadcrumb-item">{{ loan()?.title }}</a>
      <span class="breadcrumb-separator">></span>
      <span class="breadcrumb-current">{{ obligation()?.name || 'Obligation' }}</span>
    </nav>

    <div class="row" style="justify-content: space-between;">
      <h2 style="margin: 0;">Obligation Detail</h2>
      <div class="row">
        <button [routerLink]="evidenceLink()" accesskey="v">
          Evidence
          <span class="keyboard-shortcut">Alt+V</span>
        </button>
        <button (click)="reload()" [disabled]="busy()" accesskey="f">
          Refresh
          <span class="keyboard-shortcut">Alt+F</span>
        </button>
      </div>
    </div>

    <main id="main-content">
      <div class="grid two" style="margin-top: 14px;" *ngIf="obligation(); else loadingTpl">
        <div class="card">
          <h3 style="margin-top: 0;">Edit</h3>
          <form (ngSubmit)="save()" #obligationForm="ngForm" role="form" aria-label="Edit obligation form">
            <label class="muted" for="obligation-name">Name</label>
            <input id="obligation-name" [(ngModel)]="form.name" name="name" required />
            <div style="height: 10px;"></div>

            <div class="grid two">
              <div>
                <label class="muted" for="obligation-type">Type</label>
                <input id="obligation-type" [(ngModel)]="form.obligation_type" name="obligation_type" />
              </div>
              <div>
                <label class="muted" for="frequency">Frequency</label>
                <input id="frequency" [(ngModel)]="form.frequency" name="frequency" />
              </div>
            </div>

            <div style="height: 10px;"></div>
            <label class="muted" for="due-rule">Due rule</label>
            <input id="due-rule" [(ngModel)]="form.due_rule" name="due_rule" />

            <div style="height: 10px;"></div>
            <label class="muted" for="next-due-at">Next due at (ISO)</label>
            <input id="next-due-at" [(ngModel)]="form.next_due_at" name="next_due_at" />

            <div style="height: 10px;"></div>
            <label class="muted" for="description">Description</label>
            <textarea id="description" [(ngModel)]="form.description" name="description"></textarea>

            <div style="height: 10px;"></div>
            <label class="muted" for="party-responsible">Party responsible</label>
            <input id="party-responsible" [(ngModel)]="form.party_responsible" name="party_responsible" />

            <div class="row" style="margin-top: 10px;">
              <button type="submit" class="primary" [disabled]="busy()" accesskey="s">
                Save
                <span class="keyboard-shortcut">Alt+S</span>
              </button>
              <button type="button" (click)="complete()" [disabled]="busy()" accesskey="c">
                Complete
                <span class="keyboard-shortcut">Alt+C</span>
              </button>
              <button type="button" (click)="reopen()" [disabled]="busy()" accesskey="o">
                Reopen
                <span class="keyboard-shortcut">Alt+O</span>
              </button>
              <button type="button" class="danger" (click)="remove()" [disabled]="busy()" accesskey="d">
                Delete
                <span class="keyboard-shortcut">Alt+D</span>
              </button>
            </div>
            <div class="muted" style="margin-top: 10px;" *ngIf="error()" role="alert" aria-live="polite">{{ error() }}</div>
          </form>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">Evidence</h3>
          <form (ngSubmit)="uploadEvidence()" #evidenceForm="ngForm" role="form" aria-label="Upload evidence form">
            <div class="row">
              <input 
                type="file" 
                (change)="onFile($event)" 
                id="evidence-file"
                aria-label="Select file to upload as evidence"
              />
              <input 
                [(ngModel)]="note" 
                name="note"
                placeholder="Note (optional)" 
                aria-label="Optional note for evidence file"
              />
              <button type="submit" class="primary" [disabled]="busy() || !file()" accesskey="u">
                Upload
                <span class="keyboard-shortcut">Alt+U</span>
              </button>
            </div>
          </form>
          <div style="height: 10px;"></div>
          <div class="muted" *ngIf="!evidence().length">No evidence uploaded.</div>
          <table *ngIf="evidence().length" role="table" aria-label="Evidence files">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Uploaded</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of evidence()">
                <td>
                  <a [href]="api.baseUrl + '/evidence/' + e.id + '/download'" target="_blank" [attr.aria-label]="'Download ' + e.filename">{{
                    e.filename
                  }}</a>
                </td>
                <td>{{ e.uploaded_at }}</td>
                <td class="muted">{{ e.note || '' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="row" style="margin-top: 10px;">
            <button [routerLink]="evidenceLink()" accesskey="e">
              Open Evidence Page
              <span class="keyboard-shortcut">Alt+E</span>
            </button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">Audit History</h3>
          <div class="muted" *ngIf="!audit().length">No recent events.</div>
          <div class="audit-timeline" *ngIf="audit().length" role="log" aria-label="Audit history timeline">
            <div class="audit-event" *ngFor="let e of audit()" role="listitem">
              <div class="audit-icon">
                <span class="audit-icon-symbol" [ngClass]="getAuditIconClass(e.action)" [attr.aria-label]="'Action: ' + formatAuditAction(e.action)">
                  {{ getAuditIcon(e.action) }}
                </span>
              </div>
              <div class="audit-content">
                <div class="audit-header">
                  <span class="audit-action">{{ formatAuditAction(e.action) }}</span>
                  <span class="audit-time muted">{{ formatDate(e.at, { format: 'relative' }) }}</span>
                </div>
                <div class="audit-details muted" *ngIf="e.details_json && e.details_json !== '{}'">
                  {{ formatAuditDetails(e.details_json) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <ng-template #loadingTpl>
      <div class="card">
        <div class="muted" *ngIf="busy()">Loading…</div>
        <div class="muted" *ngIf="error()" role="alert" aria-live="polite">{{ error() }}</div>
      </div>
    </ng-template>
  `,
})
export class ObligationDetailPage {
  loanId = signal<number | null>(null);
  obligationId = signal<number | null>(null);

  loan = signal<LoanDetail | null>(null);
  obligation = signal<Obligation | null>(null);
  audit = signal<AuditEvent[]>([]);
  evidence = signal<Evidence[]>([]);
  file = signal<File | null>(null);
  note = '';
  busy = signal(false);
  error = signal<string | null>(null);

  form: Partial<Obligation> = {};

  constructor(
    public readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {
    const loanId = Number(this.route.snapshot.paramMap.get('loanId'));
    const obligationId = Number(this.route.snapshot.paramMap.get('obligationId'));
    this.loanId.set(Number.isFinite(loanId) ? loanId : null);
    this.obligationId.set(Number.isFinite(obligationId) ? obligationId : null);
    void this.reload();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Only handle shortcuts when Alt key is pressed and not in input fields
    if (!event.altKey || this.isInputFocused()) return;

    switch (event.key.toLowerCase()) {
      case 'v':
        event.preventDefault();
        // Navigate to evidence page
        this.router.navigate(this.evidenceLink());
        break;
      case 'f':
        event.preventDefault();
        // Refresh data
        this.reload();
        break;
      case 's':
        if (!this.busy()) {
          event.preventDefault();
          this.save();
        }
        break;
      case 'c':
        if (!this.busy()) {
          event.preventDefault();
          this.complete();
        }
        break;
      case 'o':
        if (!this.busy()) {
          event.preventDefault();
          this.reopen();
        }
        break;
      case 'd':
        if (!this.busy()) {
          event.preventDefault();
          this.remove();
        }
        break;
      case 'u':
        if (!this.busy() && this.file()) {
          event.preventDefault();
          this.uploadEvidence();
        }
        break;
      case 'e':
        event.preventDefault();
        this.router.navigate(this.evidenceLink());
        break;
    }
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || 
           activeElement?.tagName === 'TEXTAREA' || 
           activeElement?.tagName === 'SELECT';
  }

  evidenceLink(): any[] {
    return ['/loans', this.loanId(), 'obligations', this.obligationId(), 'evidence'];
  }

  async reload(): Promise<void> {
    const loanId = this.loanId();
    const obligationId = this.obligationId();
    if (loanId == null || obligationId == null) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      // Load loan details for breadcrumb
      const loanDetail = await this.api.getLoan(loanId);
      this.loan.set(loanDetail);

      const list = await this.api.listObligations(loanId);
      const found = list.find((o) => o.id === obligationId) ?? null;
      this.obligation.set(found);
      this.form = found ? { ...found } : {};
      this.evidence.set(await this.api.listEvidence(obligationId));
      this.audit.set(await this.api.listAudit(loanId, obligationId));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load obligation');
    } finally {
      this.busy.set(false);
    }
  }

  onFile(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.file.set(input.files?.item(0) ?? null);
  }

  async uploadEvidence(): Promise<void> {
    const obligationId = this.obligationId();
    const file = this.file();
    if (obligationId == null || !file) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.uploadEvidence(obligationId, file, this.note.trim() || undefined);
      this.note = '';
      this.file.set(null);
      this.toastService.success('Evidence uploaded successfully');
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Upload failed');
      this.toastService.error(e?.message ?? 'Failed to upload evidence');
    } finally {
      this.busy.set(false);
    }
  }

  async save(): Promise<void> {
    const obligationId = this.obligationId();
    if (obligationId == null) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      const updated = await this.api.updateObligation(obligationId, {
        name: this.form.name,
        obligation_type: this.form.obligation_type as any,
        frequency: this.form.frequency as any,
        due_rule: this.form.due_rule,
        next_due_at: this.form.next_due_at,
        description: this.form.description,
        party_responsible: this.form.party_responsible,
      });
      this.obligation.set(updated);
      this.form = { ...updated };
      this.toastService.success('Obligation saved successfully');
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Save failed');
      this.toastService.error(e?.message ?? 'Failed to save obligation');
    } finally {
      this.busy.set(false);
    }
  }

  async complete(): Promise<void> {
    const obligationId = this.obligationId();
    if (obligationId == null) return;

    // Show confirmation dialog
    const confirmed = confirm(
      'Are you sure you want to mark this obligation as complete?\n\n' +
      'This action will update the obligation status and cannot be easily undone.'
    );
    
    if (!confirmed) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.completeObligation(obligationId);
      this.toastService.success('Obligation marked as complete');
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Complete failed');
      this.toastService.error(e?.message ?? 'Failed to complete obligation');
    } finally {
      this.busy.set(false);
    }
  }

  async reopen(): Promise<void> {
    const obligationId = this.obligationId();
    if (obligationId == null) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.reopenObligation(obligationId);
      this.toastService.success('Obligation reopened successfully');
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Reopen failed');
      this.toastService.error(e?.message ?? 'Failed to reopen obligation');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    const obligationId = this.obligationId();
    const loanId = this.loanId();
    if (obligationId == null || loanId == null) return;

    if (!confirm('Delete this obligation?')) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.deleteObligation(obligationId);
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Delete failed');
    } finally {
      this.busy.set(false);
    }
  }

  // Helper methods for audit history display
  formatDate(date: string | Date | null | undefined, options?: any): string {
    return formatDate(date, options);
  }

  getAuditIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return '✓';
      case 'update':
      case 'updated':
        return '✏';
      case 'complete':
      case 'completed':
        return '✓';
      case 'reopen':
      case 'reopened':
        return '↻';
      case 'delete':
      case 'deleted':
        return '✗';
      case 'upload':
      case 'uploaded':
        return '📎';
      default:
        return '•';
    }
  }

  getAuditIconClass(action: string): string {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
      case 'complete':
      case 'completed':
        return 'audit-icon-success';
      case 'update':
      case 'updated':
      case 'reopen':
      case 'reopened':
        return 'audit-icon-info';
      case 'delete':
      case 'deleted':
        return 'audit-icon-danger';
      case 'upload':
      case 'uploaded':
        return 'audit-icon-info';
      default:
        return 'audit-icon-default';
    }
  }

  formatAuditAction(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  }

  formatAuditDetails(detailsJson: string): string {
    try {
      const details = JSON.parse(detailsJson);
      if (typeof details === 'object' && details !== null) {
        // Format key-value pairs nicely
        return Object.entries(details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
      return detailsJson;
    } catch {
      return detailsJson;
    }
  }
}
