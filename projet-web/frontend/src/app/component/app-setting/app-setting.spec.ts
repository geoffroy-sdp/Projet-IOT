import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSetting } from './app-setting';

describe('AppSetting', () => {
  let component: AppSetting;
  let fixture: ComponentFixture<AppSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
