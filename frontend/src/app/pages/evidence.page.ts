import { CommonModule } from '@angular/common';
import { Component, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';

import { Evidence } from '../api.models';
import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <div class="row" style="justify-content: space-between;">
      <h2 style="margin: 0;">Evidence Upload</h2>
      <button [routerLink]="backLink()" accesskey="b">
        Back
        <span class="keyboard-shortcut">Alt+B</span>
      </button>
    </div>

    <main id="main-content">
      <div class="grid two" style="margin-top: 14px;">
        <div class="card">
          <h3 style="margin-top: 0;">Upload</h3>
          <form (ngSubmit)="upload()" #uploadForm="ngForm" role="form" aria-label="Upload evidence file">
            <input 
              type="file" 
              (change)="onFile($event)" 
              id="evidence-file"
              aria-label="Select file to upload as evidence"
            />
            <div style="height: 10px;"></div>
            <label class="muted" for="evidence-note">Note (optional)</label>
            <input id="evidence-note" [(ngModel)]="note" name="note" />
            <div class="row" style="margin-top: 10px;">
              <button type="submit" class="primary" [disabled]="busy() || !file()" accesskey="u">
                Upload
                <span class="keyboard-shortcut">Alt+U</span>
              </button>
              <button type="button" (click)="reload()" [disabled]="busy()" accesskey="r">
                Refresh
                <span class="keyboard-shortcut">Alt+R</span>
              </button>
            </div>
            <div class="muted" style="margin-top: 10px;" *ngIf="error()" role="alert" aria-live="polite">{{ error() }}</div>
          </form>
        </div>

        <div class="card">
          <h3 style="margin-top: 0;">Files</h3>
          <div class="muted" *ngIf="!evidence().length">No evidence uploaded.</div>
          <table *ngIf="evidence().length" role="table" aria-label="Uploaded evidence files">
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
        </div>
      </div>
    </main>
  `,
})
export class EvidencePage {
  loanId = signal<number | null>(null);
  obligationId = signal<number | null>(null);

  evidence = signal<Evidence[]>([]);
  file = signal<File | null>(null);
  note = '';
  busy = signal(false);
  error = signal<string | null>(null);

  constructor(
    public readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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
      case 'b':
        event.preventDefault();
        // Navigate back
        this.router.navigate(this.backLink());
        break;
      case 'u':
        if (!this.busy() && this.file()) {
          event.preventDefault();
          this.upload();
        }
        break;
      case 'r':
        if (!this.busy()) {
          event.preventDefault();
          this.reload();
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

  backLink(): any[] {
    return ['/loans', this.loanId(), 'obligations', this.obligationId()];
  }

  onFile(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.file.set(input.files?.item(0) ?? null);
  }

  async upload(): Promise<void> {
    const obligationId = this.obligationId();
    const file = this.file();
    if (obligationId == null || !file) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.uploadEvidence(obligationId, file, this.note.trim() || undefined);
      this.note = '';
      this.file.set(null);
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Upload failed');
    } finally {
      this.busy.set(false);
    }
  }

  async reload(): Promise<void> {
    const obligationId = this.obligationId();
    if (obligationId == null) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.evidence.set(await this.api.listEvidence(obligationId));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load evidence');
    } finally {
      this.busy.set(false);
    }
  }
}

