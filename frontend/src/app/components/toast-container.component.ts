import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications">
      <div 
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        [class]="'toast toast--' + toast.type"
        [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast__icon">
          <span [innerHTML]="getIcon(toast.type)"></span>
        </div>
        <div class="toast__content">
          <p class="toast__message">{{ toast.message }}</p>
        </div>
        <button 
          class="toast__close"
          type="button"
          (click)="dismiss(toast.id)"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast__icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .toast__content {
      flex: 1;
      min-width: 0;
    }

    .toast__message {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .toast__close:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .toast__close:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    /* Toast type styles */
    .toast--success {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      color: #15803d;
    }

    .toast--error {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #dc2626;
    }

    .toast--warning {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #d97706;
    }

    .toast--info {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #2563eb;
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  trackByToastId(index: number, toast: ToastMessage): string {
    return toast.id;
  }

  getIcon(type: ToastMessage['type']): string {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
}