import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Listen, MusicService } from '../../services/music.service';
import { UserService } from '../../services/user.service'; // ← déjà ajouté avant

@Component({
  selector: 'app-app-home',
  imports: [CommonModule],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit, OnDestroy {
  @Output() navigationClick = new EventEmitter<string>();

  currentTime: string = '';
  currentDate: string = '';
  private timeInterval: any;

  musicListeningTime: string = '3h 45m';
  tripDuration: string = '1h 30m';
  tripCount: number = 12;
  lastDevice: string = 'Chargement...'; // ← sera remplacé par la BDD
  derniereDestination: string = 'Chargement...';
  l: Listen | null = null;

  constructor(
    private musicService: MusicService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.updateDateTime();
    this.timeInterval = setInterval(() => this.updateDateTime(), 1000);

    this.musicService.lastListen$.subscribe(listen => {
      this.l = listen;
    });

    // Dernière destination GPS
    this.userService.getGpsList(1, 1).subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          const dernierPoint = response.data[0];
          this.userService.getAdresse(dernierPoint.latitude, dernierPoint.longitude).subscribe({
            next: (data) => this.derniereDestination = data.display_name,
            error: () => this.derniereDestination = `${dernierPoint.latitude}, ${dernierPoint.longitude}`
          });
        } else {
          this.derniereDestination = 'Aucune destination';
        }
      },
      error: () => this.derniereDestination = 'Indisponible'
    });

    // ← AJOUT : dernier appareil Bluetooth
    this.userService.getBluetooth().subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          this.lastDevice = response.data[0].deviceName;
        } else {
          this.lastDevice = 'Aucun appareil';
        }
      },
      error: () => this.lastDevice = 'Indisponible'
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  updateDateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    this.currentDate = `${dayName} ${day} ${monthName} ${year}`;
  }

  goToMusic() { this.navigationClick.emit('music'); }
  goToMap() { this.navigationClick.emit('map'); }
  goToBluetooth() { this.navigationClick.emit('bluetooth'); }
  goToSettings() { this.navigationClick.emit('settings'); }
}