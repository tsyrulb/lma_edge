import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { ObligationStatus } from '../api.models';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.status = 'ON_TRACK';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render with ON_TRACK status', () => {
    component.status = 'ON_TRACK';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const badge = element.querySelector('.status-badge');
    
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('On Track');
    expect(badge.classList.contains('status-badge--blue')).toBe(true);
  });

  it('should render with DUE_SOON status', () => {
    component.status = 'DUE_SOON';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const badge = element.querySelector('.status-badge');
    
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('Due Soon');
    expect(badge.classList.contains('status-badge--yellow')).toBe(true);
  });

  it('should render with OVERDUE status', () => {
    component.status = 'OVERDUE';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const badge = element.querySelector('.status-badge');
    
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('Overdue');
    expect(badge.classList.contains('status-badge--red')).toBe(true);
  });

  it('should render with COMPLETED status', () => {
    component.status = 'COMPLETED';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const badge = element.querySelector('.status-badge');
    
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('Completed');
    expect(badge.classList.contains('status-badge--green')).toBe(true);
  });

  it('should show icon when showIcon is true', () => {
    component.status = 'ON_TRACK';
    component.showIcon = true;
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const icon = element.querySelector('.status-badge__icon');
    
    expect(icon).toBeTruthy();
    expect(icon.innerHTML).toBe('✓');
  });

  it('should show label when showLabel is true', () => {
    component.status = 'ON_TRACK';
    component.showLabel = true;
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const label = element.querySelector('.status-badge__label');
    
    expect(label).toBeTruthy();
    expect(label.textContent?.trim()).toBe('On Track');
  });

  it('should hide label when showLabel is false', () => {
    component.status = 'ON_TRACK';
    component.showLabel = false;
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const label = element.querySelector('.status-badge__label');
    
    expect(label).toBeFalsy();
  });

  it('should handle invalid status gracefully', () => {
    component.status = 'INVALID_STATUS' as ObligationStatus;
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const badge = element.querySelector('.status-badge');
    
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('On Track'); // Falls back to ON_TRACK
  });
});