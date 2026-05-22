import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription, switchMap, startWith } from 'rxjs';
import { map } from 'rxjs/operators';

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface Listen {
  listened_at: number;
  track_name: string;
  artist_name: string;
  release_name: string;
}

export interface TopArtist {
  artist_name: string;
  listen_count: number;
  artist_mbid: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const BASE_URL  = 'https://api.listenbrainz.org/1';
const USERNAME  = 'Merzouz';

@Component({
  selector: 'app-app-music',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './app-music.html',
  styleUrl: './app-music.css',
})
export class AppMusic implements OnInit, OnDestroy {

  // ── État ──────────────────────────────────────────────────────────────────

  listens:    Listen[]    = [];
  topArtists: TopArtist[] = [];
  errorListens    = '';
  errorArtists    = '';
  maxListenCount  = 0;

  private subListens!:  Subscription;
  private subArtists!:  Subscription;

  constructor(private http: HttpClient) {}

  // ── Cycle de vie ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Écoutes récentes — rafraîchi toutes les 5 min
    this.subListens = interval(300_000).pipe(
      startWith(0),
      switchMap(() =>
        this.http
          .get<any>(`${BASE_URL}/user/${USERNAME}/listens?count=10`)
          .pipe(
            map(res =>
              res.payload.listens.map((l: any): Listen => ({
                listened_at:  l.listened_at,
                track_name:   l.track_metadata.track_name,
                artist_name:  l.track_metadata.artist_name,
                release_name: l.track_metadata.release_name,
              }))
            )
          )
      )
    ).subscribe({
      next:  data  => { this.listens = data;        this.errorListens = ''; },
      error: err   => { this.errorListens = err.message; },
    });

    // Top artistes du mois — rafraîchi toutes les 20 min
    this.subArtists = interval(1200_000).pipe(
      startWith(0),
      switchMap(() =>
        this.http
          .get<any>(`${BASE_URL}/stats/user/${USERNAME}/artists?range=month&count=10`)
          .pipe(map(res => res.payload.artists as TopArtist[]))
      )
    ).subscribe({
      next: data => {
        this.topArtists    = data;
        this.maxListenCount = data[0]?.listen_count ?? 0;
        this.errorArtists  = '';
      },
      error: err => { this.errorArtists = err.message; },
    });
  }

  ngOnDestroy(): void {
    this.subListens?.unsubscribe();
    this.subArtists?.unsubscribe();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  barWidth(count: number): number {
    return this.maxListenCount > 0 ? (count / this.maxListenCount) * 100 : 0;
  }

  trackByTs(_: number, l: Listen):      number { return l.listened_at; }
  trackByMbid(_: number, a: TopArtist): string { return a.artist_mbid; }
}