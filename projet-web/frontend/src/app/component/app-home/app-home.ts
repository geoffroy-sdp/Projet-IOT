import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

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

  // Données des widgets
  musicListeningTime: string = '3h 45m'; // Temps d'écoute de musique
  tripDuration: string = '1h 30m'; // Temps de trajet
  tripCount: number = 12; // Nombre de trajets effectués
  lastDevice: string = 'Beats Pro'; // Dernier appareil connecté

  ngOnInit() {
    this.updateDateTime();
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateDateTime() {
    const now = new Date();
    
    // Formater l'heure (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    // Formater la date
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    this.currentDate = `${dayName} ${day} ${monthName} ${year}`;
  }

  // Méthodes pour gérer les clics sur les widgets
  goToMusic() {
    this.navigationClick.emit('music');
  }

  goToMap() {
    this.navigationClick.emit('map');
  }

  goToBluetooth() {
    this.navigationClick.emit('bluetooth');
  }

  goToSettings() {
    this.navigationClick.emit('settings');
  }
}
