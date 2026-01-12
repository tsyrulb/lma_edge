import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'loading-container loading-container--' + size" [attr.aria-label]="ariaLabel">
      <!-- Spinner variant -->
      <div *ngIf="type === 'spinner'" [class]="'spinner spinner--' + size">
        <div class="spinner__circle"></div>
      </div>

      <!-- Skeleton variant -->
      <div *ngIf="type === 'skeleton'" [class]="'skeleton skeleton--' + size">
        <div class="skeleton__line skeleton__line--title"></div>
        <div class="skeleton__line skeleton__line--subtitle"></div>
        <div class="skeleton__line skeleton__line--content"></div>
      </div>

      <!-- Dots variant -->
      <div *ngIf="type === 'dots'" [class]="'dots dots--' + size">
        <div class="dots__dot"></div>
        <div class="dots__dot"></div>
        <div class="dots__dot"></div>
      </div>

      <!-- Optional text -->
      <div *ngIf="text" class="loading-text">{{ text }}</div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .loading-text {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }

    /* Spinner styles */
    .spinner {
      display: inline-block;
      position: relative;
    }

    .spinner--small {
      width: 16px;
      height: 16px;
    }

    .spinner--medium {
      width: 24px;
      height: 24px;
    }

    .spinner--large {
      width: 32px;
      height: 32px;
    }

    .spinner__circle {
      width: 100%;
      height: 100%;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Skeleton styles */
    .skeleton {
      width: 100%;
      max-width: 300px;
    }

    .skeleton--small {
      max-width: 150px;
    }

    .skeleton--medium {
      max-width: 300px;
    }

    .skeleton--large {
      max-width: 450px;
    }

    .skeleton__line {
      height: 12px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton__line--title {
      height: 16px;
      width: 70%;
    }

    .skeleton__line--subtitle {
      height: 12px;
      width: 50%;
    }

    .skeleton__line--content {
      height: 10px;
      width: 90%;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Dots styles */
    .dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .dots--small .dots__dot {
      width: 4px;
      height: 4px;
    }

    .dots--medium .dots__dot {
      width: 6px;
      height: 6px;
    }

    .dots--large .dots__dot {
      width: 8px;
      height: 8px;
    }

    .dots__dot {
      background-color: #3b82f6;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .dots__dot:nth-child(1) { animation-delay: -0.32s; }
    .dots__dot:nth-child(2) { animation-delay: -0.16s; }
    .dots__dot:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() type: 'spinner' | 'skeleton' | 'dots' = 'spinner';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() text?: string;

  get ariaLabel(): string {
    return this.text || 'Loading...';
  }
}