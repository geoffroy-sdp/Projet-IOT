import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMusic } from './app-music';

describe('AppMusic', () => {
  let component: AppMusic;
  let fixture: ComponentFixture<AppMusic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMusic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppMusic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
