import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { AppMusic } from './app-music';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_LISTENS = {
  payload: {
    listens: [
      {
        listened_at: 1779184692,
        track_metadata: {
          track_name:   'Be Free',
          artist_name:  'Papa Roach',
          release_name: 'Getting Away With Murder',
        },
      },
    ],
  },
};

const MOCK_ARTISTS = {
  payload: {
    artists: [
      { artist_name: 'Linkin Park', listen_count: 226, artist_mbid: 'f59c5520' },
      { artist_name: 'Slipknot',   listen_count: 178, artist_mbid: 'a466c2a2' },
    ],
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppMusic', () => {
  let component: AppMusic;
  let fixture:   ComponentFixture<AppMusic>;
  let http:      HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMusic],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AppMusic);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify(); // vérifie qu'aucune requête non interceptée ne traîne
  });

  it('should create', () => {
    fixture.detectChanges(); // déclenche ngOnInit → émet les requêtes
    http.expectOne(r => r.url.includes('/listens')).flush(MOCK_LISTENS);
    http.expectOne(r => r.url.includes('/artists')).flush(MOCK_ARTISTS);
    expect(component).toBeTruthy();
  });

  it('should populate listens after HTTP response', fakeAsync(() => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/listens')).flush(MOCK_LISTENS);
    http.expectOne(r => r.url.includes('/artists')).flush(MOCK_ARTISTS);
    tick();
    expect(component.listens.length).toBe(1);
    expect(component.listens[0].track_name).toBe('Be Free');
  }));

  it('should populate topArtists and compute maxListenCount', fakeAsync(() => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/listens')).flush(MOCK_LISTENS);
    http.expectOne(r => r.url.includes('/artists')).flush(MOCK_ARTISTS);
    tick();
    expect(component.topArtists.length).toBe(2);
    expect(component.maxListenCount).toBe(226);
  }));

  it('barWidth() should return 100 for the top artist', fakeAsync(() => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/listens')).flush(MOCK_LISTENS);
    http.expectOne(r => r.url.includes('/artists')).flush(MOCK_ARTISTS);
    tick();
    expect(component.barWidth(226)).toBe(100);
    expect(component.barWidth(113)).toBeCloseTo(50, 0);
  }));

  it('should set errorListens on HTTP failure', fakeAsync(() => {
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/listens'))
        .flush('', { status: 500, statusText: 'Server Error' });
    http.expectOne(r => r.url.includes('/artists')).flush(MOCK_ARTISTS);
    tick();
    expect(component.errorListens).toBeTruthy();
  }));
});