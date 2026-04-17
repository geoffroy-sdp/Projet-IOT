import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppForgotPassword } from './app-forgot-password';

describe('AppForgotPassword', () => {
  let component: AppForgotPassword;
  let fixture: ComponentFixture<AppForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppForgotPassword]
    }).compileComponents();

    fixture = TestBed.createComponent(AppForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
