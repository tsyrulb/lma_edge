import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display toasts from service', () => {
    toastService.show('Test message', 'info');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const toasts = element.querySelectorAll('.toast');
    
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Test message');
  });

  it('should display multiple toasts', () => {
    toastService.show('Message 1', 'info');
    toastService.show('Message 2', 'success');
    toastService.show('Message 3', 'error');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const toasts = element.querySelectorAll('.toast');
    
    expect(toasts.length).toBe(3);
  });

  it('should apply correct CSS classes for toast types', () => {
    toastService.show('Success message', 'success');
    toastService.show('Error message', 'error');
    toastService.show('Warning message', 'warning');
    toastService.show('Info message', 'info');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const toasts = element.querySelectorAll('.toast');
    
    expect(toasts[0].classList.contains('toast--success')).toBe(true);
    expect(toasts[1].classList.contains('toast--error')).toBe(true);
    expect(toasts[2].classList.contains('toast--warning')).toBe(true);
    expect(toasts[3].classList.contains('toast--info')).toBe(true);
  });

  it('should display correct icons for toast types', () => {
    toastService.show('Success message', 'success');
    toastService.show('Error message', 'error');
    toastService.show('Warning message', 'warning');
    toastService.show('Info message', 'info');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const icons = element.querySelectorAll('.toast__icon span');
    
    expect(icons[0].innerHTML).toBe('✅');
    expect(icons[1].innerHTML).toBe('❌');
    expect(icons[2].innerHTML).toBe('⚠️');
    expect(icons[3].innerHTML).toBe('ℹ️');
  });

  it('should have correct ARIA attributes', () => {
    toastService.show('Error message', 'error');
    toastService.show('Info message', 'info');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const container = element.querySelector('.toast-container');
    const toasts = element.querySelectorAll('.toast');
    
    expect(container.getAttribute('role')).toBe('region');
    expect(container.getAttribute('aria-label')).toBe('Notifications');
    
    expect(toasts[0].getAttribute('role')).toBe('alert');
    expect(toasts[0].getAttribute('aria-live')).toBe('assertive');
    
    expect(toasts[1].getAttribute('role')).toBe('status');
    expect(toasts[1].getAttribute('aria-live')).toBe('polite');
  });

  it('should dismiss toast when close button is clicked', () => {
    const id = toastService.show('Test message', 'info');
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const closeButton = element.querySelector('.toast__close');
    
    expect(element.querySelectorAll('.toast').length).toBe(1);
    
    closeButton.click();
    fixture.detectChanges();
    
    expect(element.querySelectorAll('.toast').length).toBe(0);
  });

  it('should track toasts by ID', () => {
    const toast1 = { id: 'toast-1', type: 'info' as const, message: 'Test 1', duration: 3000, timestamp: Date.now() };
    const toast2 = { id: 'toast-2', type: 'info' as const, message: 'Test 2', duration: 3000, timestamp: Date.now() };
    
    expect(component.trackByToastId(0, toast1)).toBe('toast-1');
    expect(component.trackByToastId(1, toast2)).toBe('toast-2');
  });

  it('should return correct icon for each toast type', () => {
    expect(component.getIcon('success')).toBe('✅');
    expect(component.getIcon('error')).toBe('❌');
    expect(component.getIcon('warning')).toBe('⚠️');
    expect(component.getIcon('info')).toBe('ℹ️');
  });

  it('should handle unknown toast type gracefully', () => {
    expect(component.getIcon('unknown' as any)).toBe('ℹ️');
  });

  it('should update when toasts are added/removed', () => {
    fixture.detectChanges();
    expect(component.toasts.length).toBe(0);
    
    toastService.show('Test message');
    fixture.detectChanges();
    expect(component.toasts.length).toBe(1);
    
    toastService.clear();
    fixture.detectChanges();
    expect(component.toasts.length).toBe(0);
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const subscription = (component as any).subscription;
    
    jest.spyOn(subscription, 'unsubscribe');
    
    component.ngOnDestroy();
    
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});