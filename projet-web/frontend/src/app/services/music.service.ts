import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Listen {
  listened_at: number;
  track_name: string;
  artist_name: string;
  release_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private readonly BASE_URL = 'https://api.listenbrainz.org/1';
  private readonly USERNAME = 'Merzouz';

  private lastListenSubject = new BehaviorSubject<Listen | null>(null);
  public lastListen$ = this.lastListenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchLastListen();
    // Rafraîchir toutes les 60 secondes
    setInterval(() => this.fetchLastListen(), 60000);
  }

  private fetchLastListen(): void {
    this.http
      .get<any>(`${this.BASE_URL}/user/${this.USERNAME}/listens?count=1`)
      .pipe(
        map(res => {
          if (res.payload.listens.length > 0) {
            const l = res.payload.listens[0];
            return {
              listened_at: l.listened_at,
              track_name: l.track_metadata.track_name,
              artist_name: l.track_metadata.artist_name,
              release_name: l.track_metadata.release_name,
            } as Listen;
          }
          return null;
        })
      )
      .subscribe({
        next: (listen) => this.lastListenSubject.next(listen),
        error: (err) => console.error('Error fetching last listen:', err)
      });
  }
}
