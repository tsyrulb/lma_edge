import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render spinner type by default', () => {
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const spinner = element.querySelector('.spinner');
    const skeleton = element.querySelector('.skeleton');
    const dots = element.querySelector('.dots');
    
    expect(spinner).toBeTruthy();
    expect(skeleton).toBeFalsy();
    expect(dots).toBeFalsy();
  });

  it('should render skeleton type when specified', () => {
    component.type = 'skeleton';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const spinner = element.querySelector('.spinner');
    const skeleton = element.querySelector('.skeleton');
    const dots = element.querySelector('.dots');
    
    expect(spinner).toBeFalsy();
    expect(skeleton).toBeTruthy();
    expect(dots).toBeFalsy();
  });

  it('should render dots type when specified', () => {
    component.type = 'dots';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const spinner = element.querySelector('.spinner');
    const skeleton = element.querySelector('.skeleton');
    const dots = element.querySelector('.dots');
    
    expect(spinner).toBeFalsy();
    expect(skeleton).toBeFalsy();
    expect(dots).toBeTruthy();
  });

  it('should apply correct size classes', () => {
    component.size = 'large';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const container = element.querySelector('.loading-container');
    
    expect(container.classList.contains('loading-container--large')).toBe(true);
  });

  it('should display text when provided', () => {
    component.text = 'Loading data...';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const textElement = element.querySelector('.loading-text');
    
    expect(textElement).toBeTruthy();
    expect(textElement.textContent?.trim()).toBe('Loading data...');
  });

  it('should not display text when not provided', () => {
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const textElement = element.querySelector('.loading-text');
    
    expect(textElement).toBeFalsy();
  });

  it('should have correct aria-label', () => {
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const container = element.querySelector('.loading-container');
    
    expect(container.getAttribute('aria-label')).toBe('Loading...');
  });

  it('should use custom text as aria-label', () => {
    component.text = 'Processing request...';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const container = element.querySelector('.loading-container');
    
    expect(container.getAttribute('aria-label')).toBe('Processing request...');
  });

  it('should render skeleton with multiple lines', () => {
    component.type = 'skeleton';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const lines = element.querySelectorAll('.skeleton__line');
    
    expect(lines.length).toBe(3); // title, subtitle, content
    expect(lines[0].classList.contains('skeleton__line--title')).toBe(true);
    expect(lines[1].classList.contains('skeleton__line--subtitle')).toBe(true);
    expect(lines[2].classList.contains('skeleton__line--content')).toBe(true);
  });

  it('should render dots with correct number of dots', () => {
    component.type = 'dots';
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const dots = element.querySelectorAll('.dots__dot');
    
    expect(dots.length).toBe(3);
  });
});