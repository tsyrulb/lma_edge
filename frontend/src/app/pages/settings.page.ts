import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 style="margin: 0;">Settings</h2>
    <div class="card" style="margin-top: 14px; max-width: 720px;">
      <label class="muted">API Base URL</label>
      <input [(ngModel)]="baseUrl" placeholder="http://localhost:8000/api" />
      <div class="row" style="margin-top: 10px;">
        <button class="primary" (click)="save()">Save</button>
        <button (click)="reset()">Reset</button>
        <button (click)="check()">Check API</button>
      </div>
      <div class="muted" style="margin-top: 10px;" *ngIf="message()">{{ message() }}</div>
    </div>
  `,
})
export class SettingsPage {
  baseUrl = '';
  message = signal<string | null>(null);

  constructor(private readonly api: ApiService) {
    this.baseUrl = this.api.baseUrl;
  }

  save(): void {
    this.api.baseUrl = this.baseUrl.trim();
    this.message.set('Saved.');
  }

  reset(): void {
    localStorage.removeItem('api.baseUrl');
    this.baseUrl = this.api.baseUrl;
    this.message.set('Reset to default.');
  }

  async check(): Promise<void> {
    this.message.set('Checking…');
    try {
      const res = await this.api.health();
      this.message.set(`API: ${res.status}`);
    } catch (e: any) {
      this.message.set(e?.message ?? 'API not reachable');
    }
  }
}
