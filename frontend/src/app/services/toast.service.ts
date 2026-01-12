import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number; // milliseconds
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private toasts: ToastMessage[] = [];
  private nextId = 1;

  public toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  show(message: string, type: ToastMessage['type'] = 'info', duration: number = 3000): string {
    const id = `toast-${this.nextId++}`;
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration,
      timestamp: Date.now()
    };

    this.toasts = [...this.toasts, toast];
    this.toastsSubject.next(this.toasts);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, duration: number = 3000): string {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 5000): string {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 4000): string {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 3000): string {
    return this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(this.toasts);
  }

  clear(): void {
    this.toasts = [];
    this.toastsSubject.next(this.toasts);
  }

  getToasts(): ToastMessage[] {
    return [...this.toasts];
  }
}