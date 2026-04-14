import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppBluetooth } from './app-bluetooth';

describe('AppBluetooth', () => {
  let component: AppBluetooth;
  let fixture: ComponentFixture<AppBluetooth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppBluetooth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppBluetooth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
