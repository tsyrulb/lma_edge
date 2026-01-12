import { TestBed } from '@angular/core/testing';
import { ToastService, ToastMessage } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a toast message', () => {
    const id = service.show('Test message', 'info', 1000);
    
    expect(id).toBeTruthy();
    expect(id).toMatch(/^toast-\d+$/);
    
    const toasts = service.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].duration).toBe(1000);
  });

  it('should show success toast', () => {
    service.success('Success message');
    
    const toasts = service.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Success message');
    expect(toasts[0].duration).toBe(3000);
  });

  it('should show error toast', () => {
    service.error('Error message');
    
    const toasts = service.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Error message');
    expect(toasts[0].duration).toBe(5000);
  });

  it('should show warning toast', () => {
    service.warning('Warning message');
    
    const toasts = service.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[0].message).toBe('Warning message');
    expect(toasts[0].duration).toBe(4000);
  });

  it('should show info toast', () => {
    service.info('Info message');
    
    const toasts = service.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].message).toBe('Info message');
    expect(toasts[0].duration).toBe(3000);
  });

  it('should dismiss a toast by id', () => {
    const id = service.show('Test message');
    expect(service.getToasts().length).toBe(1);
    
    service.dismiss(id);
    expect(service.getToasts().length).toBe(0);
  });

  it('should clear all toasts', () => {
    service.show('Message 1');
    service.show('Message 2');
    service.show('Message 3');
    
    expect(service.getToasts().length).toBe(3);
    
    service.clear();
    expect(service.getToasts().length).toBe(0);
  });

  it('should emit toasts through observable', (done) => {
    service.toasts$.subscribe(toasts => {
      if (toasts.length === 1) {
        expect(toasts[0].message).toBe('Observable test');
        done();
      }
    });
    
    service.show('Observable test');
  });

  it('should auto-dismiss toast after duration', (done) => {
    service.show('Auto dismiss test', 'info', 100);
    
    expect(service.getToasts().length).toBe(1);
    
    setTimeout(() => {
      expect(service.getToasts().length).toBe(0);
      done();
    }, 150);
  });

  it('should not auto-dismiss when duration is 0', (done) => {
    service.show('No auto dismiss', 'info', 0);
    
    expect(service.getToasts().length).toBe(1);
    
    setTimeout(() => {
      expect(service.getToasts().length).toBe(1);
      done();
    }, 100);
  });

  it('should generate unique IDs for toasts', () => {
    const id1 = service.show('Message 1');
    const id2 = service.show('Message 2');
    const id3 = service.show('Message 3');
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should include timestamp in toast messages', () => {
    const beforeTime = Date.now();
    service.show('Timestamp test');
    const afterTime = Date.now();
    
    const toasts = service.getToasts();
    expect(toasts[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(toasts[0].timestamp).toBeLessThanOrEqual(afterTime);
  });
});