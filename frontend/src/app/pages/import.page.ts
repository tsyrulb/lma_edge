import { CommonModule } from '@angular/common';
import { Component, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Obligation } from '../api.models';
import { ApiService } from '../api.service';
import { LoadingSpinnerComponent } from '../components/loading-spinner.component';
import { ToastService } from '../services/toast.service';
import { MockDataService } from '../services/mock-data.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <div class="row" style="justify-content: space-between;">
      <h2 style="margin: 0;">Loan Import</h2>
    </div>

    <main id="main-content">
      <div class="grid two" style="margin-top: 14px;">
        <div class="card">
          <h3 style="margin-top: 0;">Create Loan</h3>
          <form (ngSubmit)="createAndExtract()" #loanForm="ngForm" role="form" aria-label="Create loan and extract obligations">
            <label class="muted" for="loan-title">Loan title</label>
            <input id="loan-title" [(ngModel)]="title" name="title" placeholder="DemoCo Facility Agreement" />

            <div style="height: 10px;"></div>
            <label class="muted" for="agreement-text">Agreement text (paste)</label>
            <textarea id="agreement-text" [(ngModel)]="text" name="text" placeholder="Paste loan agreement excerpts here…"></textarea>

            <div class="row" style="margin-top: 10px;">
              <button type="submit" class="primary" [disabled]="busy()" accesskey="x">
                Extract obligations
                <span class="keyboard-shortcut">Alt+X</span>
              </button>
              <button type="button" (click)="generateDemo()" [disabled]="busy()" accesskey="g">
                Generate demo obligations
                <span class="keyboard-shortcut">Alt+G</span>
              </button>
            </div>
          </form>
          
          <!-- Progress indicator during extraction -->
          <div *ngIf="busy() && extractionInProgress()" style="margin-top: 15px;">
            <app-loading-spinner 
              type="spinner" 
              size="medium" 
              text="Extracting obligations from agreement text...">
            </app-loading-spinner>
          </div>
          
          <div class="muted" style="margin-top: 10px;" *ngIf="busy() && !extractionInProgress()">Working…</div>
          <div class="muted" style="margin-top: 10px;" *ngIf="error()" role="alert" aria-live="polite">{{ error() }}</div>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">Review & Edit</h3>
          <div class="muted" *ngIf="!obligations().length && !busy()">
            Run extraction to populate obligations.
            <div style="margin-top: 10px;" *ngIf="loanId()">
              <button (click)="generateDemoObligations()" class="primary" accesskey="d">
                Generate Demo Obligations
                <span class="keyboard-shortcut">Alt+D</span>
              </button>
              <div class="muted" style="margin-top: 5px; font-size: 12px;">
                Create sample obligations to explore the application
              </div>
            </div>
          </div>
          <div *ngIf="obligations().length">
            <div class="row" style="margin-bottom: 10px; justify-content: space-between; align-items: center;">
              <div>
                <button 
                  (click)="toggleBulkEditMode()" 
                  [class]="bulkEditMode() ? 'primary' : ''"
                  style="margin-right: 10px;"
                  accesskey="b"
                  [attr.aria-pressed]="bulkEditMode()">
                  {{ bulkEditMode() ? 'Exit Bulk Edit' : 'Bulk Edit' }}
                  <span class="keyboard-shortcut">Alt+B</span>
                </button>
                <span *ngIf="bulkEditMode() && selectedObligationIds().size > 0" class="muted" aria-live="polite">
                  {{ selectedObligationIds().size }} selected
                </span>
              </div>
              <div *ngIf="bulkEditMode() && selectedObligationIds().size > 0">
                <select #bulkTypeSelect style="margin-right: 5px;" aria-label="Change type for selected obligations">
                  <option value="">Change Type...</option>
                  <option value="REPORTING">Reporting</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="COVENANT">Covenant</option>
                </select>
                <select #bulkFreqSelect style="margin-right: 5px;" aria-label="Change frequency for selected obligations">
                  <option value="">Change Frequency...</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUALLY">Annually</option>
                  <option value="ONE_TIME">One Time</option>
                </select>
                <button (click)="applyBulkChanges(bulkTypeSelect.value, bulkFreqSelect.value)" class="primary" accesskey="a">
                  Apply Changes
                  <span class="keyboard-shortcut">Alt+A</span>
                </button>
              </div>
            </div>
            
            <table role="table" aria-label="Extracted obligations for review">
              <thead>
                <tr>
                  <th *ngIf="bulkEditMode()" scope="col" style="width: 40px;">
                    <input 
                      type="checkbox" 
                      [checked]="isAllSelected()"
                      [indeterminate]="isSomeSelected()"
                      (change)="toggleSelectAll($event)"
                      aria-label="Select all obligations">
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Freq</th>
                  <th scope="col">Due rule</th>
                  <th scope="col">Next due</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of obligations(); trackBy: trackByObligationId" 
                    [class.newly-extracted]="newlyExtractedIds().has(o.id)"
                    [class.selected]="selectedObligationIds().has(o.id)">
                  <td *ngIf="bulkEditMode()">
                    <input 
                      type="checkbox" 
                      [checked]="selectedObligationIds().has(o.id)"
                      (change)="toggleObligationSelection(o.id, $event)"
                      [attr.aria-label]="'Select ' + o.name">
                  </td>
                  <td><input [(ngModel)]="o.name" [attr.aria-label]="'Edit name for ' + o.name" /></td>
                  <td><input [(ngModel)]="o.obligation_type" [attr.aria-label]="'Edit type for ' + o.name" /></td>
                  <td><input [(ngModel)]="o.frequency" [attr.aria-label]="'Edit frequency for ' + o.name" /></td>
                  <td><input [(ngModel)]="o.due_rule" [attr.aria-label]="'Edit due rule for ' + o.name" /></td>
                  <td><input [(ngModel)]="o.next_due_at" [attr.aria-label]="'Edit next due date for ' + o.name" /></td>
                </tr>
              </tbody>
            </table>
            <div class="row" style="margin-top: 10px;">
              <button class="primary" (click)="saveEdits()" [disabled]="busy()" accesskey="s">
                Save edits
                <span class="keyboard-shortcut">Alt+S</span>
              </button>
              <button (click)="goToDashboard()" [disabled]="busy()" accesskey="h">
                Go to dashboard
                <span class="keyboard-shortcut">Alt+H</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .newly-extracted {
      background-color: #fef3c7 !important;
      border-left: 4px solid #f59e0b;
      animation: highlight-fade 3s ease-out;
    }
    
    @keyframes highlight-fade {
      0% {
        background-color: #fbbf24;
      }
      100% {
        background-color: #fef3c7;
      }
    }
    
    .newly-extracted input {
      background-color: transparent;
    }
    
    .selected {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
    }
    
    .selected input {
      background-color: transparent;
    }
  `]
})
export class ImportPage {
  title = 'DemoCo Facility Agreement';
  text = '';
  busy = signal(false);
  error = signal<string | null>(null);
  obligations = signal<Obligation[]>([]);
  loanId = signal<number | null>(null);
  extractionInProgress = signal(false);
  newlyExtractedIds = signal<Set<number>>(new Set());
  selectedObligationIds = signal<Set<number>>(new Set());
  bulkEditMode = signal(false);

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly mockDataService: MockDataService,
  ) {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Only handle shortcuts when Alt key is pressed and not in input fields
    if (!event.altKey || this.isInputFocused()) return;

    switch (event.key.toLowerCase()) {
      case 'x':
        if (!this.busy()) {
          event.preventDefault();
          this.createAndExtract();
        }
        break;
      case 'g':
        if (!this.busy()) {
          event.preventDefault();
          this.generateDemo();
        }
        break;
      case 'd':
        if (!this.busy() && this.loanId()) {
          event.preventDefault();
          this.generateDemoObligations();
        }
        break;
      case 'b':
        if (this.obligations().length > 0) {
          event.preventDefault();
          this.toggleBulkEditMode();
        }
        break;
      case 'a':
        if (this.bulkEditMode() && this.selectedObligationIds().size > 0) {
          event.preventDefault();
          // Focus on the bulk type select to allow user to make changes
          const bulkTypeSelect = document.querySelector('select[aria-label*="Change type"]') as HTMLSelectElement;
          if (bulkTypeSelect) {
            bulkTypeSelect.focus();
          }
        }
        break;
      case 's':
        if (!this.busy() && this.obligations().length > 0) {
          event.preventDefault();
          this.saveEdits();
        }
        break;
      case 'h':
        if (!this.busy()) {
          event.preventDefault();
          this.goToDashboard();
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

  async createAndExtract(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    this.extractionInProgress.set(false);
    
    try {
      const loan = await this.api.createLoan(this.title.trim() || 'Untitled loan');
      this.loanId.set(loan.id);
      
      if (this.text.trim()) {
        await this.api.importText(loan.id, this.text.trim());
      }
      
      // Set extraction progress indicator
      this.extractionInProgress.set(true);
      const result = await this.api.extract(loan.id, this.text.trim() || undefined);
      this.obligations.set(result.obligations);
      
      // Check if extraction returned no results and suggest demo data
      if (result.obligations.length === 0) {
        this.showDemoDataSuggestion();
      } else {
        // Mark newly extracted obligations for highlighting
        const newIds = new Set(result.obligations.map(o => o.id));
        this.newlyExtractedIds.set(newIds);
        
        // Clear highlighting after 3 seconds
        setTimeout(() => {
          this.newlyExtractedIds.set(new Set());
        }, 3000);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Import failed');
    } finally {
      this.busy.set(false);
      this.extractionInProgress.set(false);
    }
  }

  async generateDemo(): Promise<void> {
    if (!this.text.trim()) {
      this.text =
        'Borrower shall deliver quarterly financial statements within 45 days after quarter-end and annual audited statements within 120 days after fiscal year-end.';
    }
    await this.createAndExtract();
  }

  async saveEdits(): Promise<void> {
    const items = this.obligations();
    if (!items.length) return;

    this.error.set(null);
    this.busy.set(true);
    try {
      const updated: Obligation[] = [];
      for (const o of items) {
        updated.push(
          await this.api.updateObligation(o.id, {
            name: o.name,
            obligation_type: o.obligation_type as any,
            frequency: o.frequency as any,
            due_rule: o.due_rule,
            next_due_at: o.next_due_at,
            description: o.description,
            party_responsible: o.party_responsible,
          }),
        );
      }
      this.obligations.set(updated);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Save failed');
    } finally {
      this.busy.set(false);
    }
  }

  goToDashboard(): void {
    void this.router.navigateByUrl('/');
  }

  toggleBulkEditMode(): void {
    this.bulkEditMode.set(!this.bulkEditMode());
    if (!this.bulkEditMode()) {
      this.selectedObligationIds.set(new Set());
    }
  }

  toggleObligationSelection(obligationId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const selected = new Set(this.selectedObligationIds());
    
    if (checkbox.checked) {
      selected.add(obligationId);
    } else {
      selected.delete(obligationId);
    }
    
    this.selectedObligationIds.set(selected);
  }

  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const selected = new Set<number>();
    
    if (checkbox.checked) {
      // Select all obligations
      this.obligations().forEach(o => selected.add(o.id));
    }
    // If unchecked, selected remains empty (deselect all)
    
    this.selectedObligationIds.set(selected);
  }

  isAllSelected(): boolean {
    const obligations = this.obligations();
    const selected = this.selectedObligationIds();
    return obligations.length > 0 && obligations.every(o => selected.has(o.id));
  }

  isSomeSelected(): boolean {
    const obligations = this.obligations();
    const selected = this.selectedObligationIds();
    return selected.size > 0 && selected.size < obligations.length;
  }

  applyBulkChanges(newType: string, newFrequency: string): void {
    if (!newType && !newFrequency) return;
    
    const selected = this.selectedObligationIds();
    const updatedObligations = this.obligations().map(o => {
      if (selected.has(o.id)) {
        const updated = { ...o };
        if (newType) updated.obligation_type = newType as any;
        if (newFrequency) updated.frequency = newFrequency as any;
        return updated;
      }
      return o;
    });
    
    this.obligations.set(updatedObligations);
    
    // Clear selections after applying changes
    this.selectedObligationIds.set(new Set());
  }

  private showDemoDataSuggestion(): void {
    this.toastService.show(
      'No obligations found in the text. Would you like to generate demo data instead?',
      'info',
      0 // Don\'t auto-dismiss
    );
  }

  async generateDemoObligations(): Promise<void> {
    if (!this.loanId()) return;
    
    this.error.set(null);
    this.busy.set(true);
    
    try {
      // Generate demo obligations for the current loan
      const result = await this.api.extract(this.loanId()!, 'Demo data generation');
      this.obligations.set(result.obligations);
      
      // Mark newly generated obligations for highlighting
      const newIds = new Set(result.obligations.map(o => o.id));
      this.newlyExtractedIds.set(newIds);
      
      // Clear highlighting after 3 seconds
      setTimeout(() => {
        this.newlyExtractedIds.set(new Set());
      }, 3000);
      
      this.toastService.success('Demo obligations generated successfully!');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to generate demo data');
    } finally {
      this.busy.set(false);
    }
  }
}
