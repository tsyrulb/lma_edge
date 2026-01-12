import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 style="margin: 0;">Demo Data</h2>
    <div class="card" style="margin-top: 14px;">
      <p class="muted" style="margin-top: 0;">
        Creates a demo loan and populates obligations via the MockExtractor for reliable demos.
      </p>
      <div class="row">
        <button class="primary" (click)="createDemo()" [disabled]="busy()">Create demo loan</button>
        <button (click)="checkHealth()" [disabled]="busy()">Check API</button>
      </div>
      <div class="muted" style="margin-top: 10px;" *ngIf="busy()">Working…</div>
      <div class="muted" style="margin-top: 10px;" *ngIf="message()">{{ message() }}</div>
      <div class="muted" style="margin-top: 10px;" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class DemoPage {
  busy = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  async checkHealth(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const res = await this.api.health();
      this.message.set(`API: ${res.status}`);
    } catch (e: any) {
      this.error.set(e?.message ?? 'API not reachable');
    } finally {
      this.busy.set(false);
    }
  }

  async createDemo(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const loan = await this.api.createLoan('DemoCo Facility Agreement');
      const demoText =
        'Borrower shall deliver quarterly financial statements within 45 days after quarter-end and annual audited statements within 120 days after fiscal year-end. Borrower shall notify the Agent within 2 business days of any Default or Event of Default.';
      await this.api.importText(loan.id, demoText);
      await this.api.extract(loan.id, demoText);
      this.message.set(`Created loan #${loan.id} and extracted obligations.`);
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Demo creation failed');
    } finally {
      this.busy.set(false);
    }
  }
}

