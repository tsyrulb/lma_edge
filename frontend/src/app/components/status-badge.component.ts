import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObligationStatus } from '../api.models';

interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      [class]="'status-badge status-badge--' + config.color"
      [attr.aria-label]="config.label"
      [style.background-color]="config.bgColor"
      [style.color]="config.textColor"
    >
      <span class="status-badge__icon" [innerHTML]="config.icon"></span>
      <span class="status-badge__label" *ngIf="showLabel">{{ config.label }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      white-space: nowrap;
    }

    .status-badge--small {
      padding: 2px 6px;
      font-size: 11px;
    }

    .status-badge--medium {
      padding: 4px 8px;
      font-size: 12px;
    }

    .status-badge--large {
      padding: 6px 12px;
      font-size: 14px;
    }

    .status-badge__icon {
      display: inline-flex;
      align-items: center;
      width: 12px;
      height: 12px;
    }

    .status-badge__label {
      margin-left: 2px;
    }

    /* Color variants */
    .status-badge--blue {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-badge--yellow {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-badge--red {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .status-badge--green {
      background-color: #dcfce7;
      color: #16a34a;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status!: ObligationStatus;
  @Input() showIcon: boolean = true;
  @Input() showLabel: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  private readonly STATUS_CONFIG: Record<ObligationStatus, StatusConfig> = {
    ON_TRACK: {
      label: 'On Track',
      icon: '✓',
      color: 'blue',
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    },
    DUE_SOON: {
      label: 'Due Soon',
      icon: '⏰',
      color: 'yellow',
      bgColor: '#fef3c7',
      textColor: '#92400e'
    },
    OVERDUE: {
      label: 'Overdue',
      icon: '⚠️',
      color: 'red',
      bgColor: '#fee2e2',
      textColor: '#dc2626'
    },
    COMPLETED: {
      label: 'Completed',
      icon: '✅',
      color: 'green',
      bgColor: '#dcfce7',
      textColor: '#16a34a'
    }
  };

  get config(): StatusConfig {
    return this.STATUS_CONFIG[this.status] || this.STATUS_CONFIG.ON_TRACK;
  }
}