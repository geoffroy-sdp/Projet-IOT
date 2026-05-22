import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { UserService, GpsPoint } from '../../services/user.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-map.html',
  styleUrl: './app-map.css',
})
export class AppMap implements AfterViewInit, OnInit {
  private map: any;
  points: (GpsPoint & { adresse?: string })[] = []; // ← adresse ajoutée
  chargement = true;
  erreur = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
  this.userService.getGpsList().subscribe({
    next: (response) => {
      this.points = response.data;
      this.chargement = false;
      this.afficherSurCarte();
      this.chargerAdresses();
    },
    error: (err) => {
      console.log('STATUS:', err.status);       // ← 401, 404, 500 ?
      console.log('MESSAGE:', err.message);
      console.log('ERREUR COMPLÈTE:', err);
      this.erreur = `Erreur ${err.status} : ${err.message}`;
      this.chargement = false;
    }
  });
}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.map.invalidateSize();
    }, 0);
  }

  private initMap(): void {
    this.map = L.map('map').setView([44.354128, 1.203491], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private afficherSurCarte(): void {
    if (!this.map || this.points.length === 0) return;

    const coordonnees: [number, number][] = this.points.map(p => [p.latitude, p.longitude]);
    L.polyline(coordonnees, { color: '#3b82f6', weight: 3 }).addTo(this.map);

    const debut = this.points[0];
    L.marker([debut.latitude, debut.longitude])
      .addTo(this.map)
      .bindPopup(`<b>Départ</b><br>${debut.latitude}, ${debut.longitude}`)
      .openPopup();

    const fin = this.points[this.points.length - 1];
    L.marker([fin.latitude, fin.longitude])
      .addTo(this.map)
      .bindPopup(`<b>Arrivée</b><br>${fin.latitude}, ${fin.longitude}`);

    this.map.fitBounds(coordonnees);
  }

  // Charger les adresses une par une avec délai (limite Nominatim : 1 req/sec)
  private chargerAdresses(): void {
    this.points.forEach((point, index) => {
      setTimeout(() => {
        this.userService.getAdresse(point.latitude, point.longitude).subscribe({
          next: (data) => {
            point.adresse = data.display_name;
          },
          error: () => {
            point.adresse = 'Adresse non disponible';
          }
        });
      }, index * 1100); // ← 1.1 sec entre chaque requête
    });
  }

  centrerSurPoint(point: GpsPoint): void {
    this.map.setView([point.latitude, point.longitude], 15);
  }
}