import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMap } from './app-map';

describe('AppMap', () => {
  let component: AppMap;
  let fixture: ComponentFixture<AppMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
