import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

// Fix des icônes Leaflet avec Angular/Webpack
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-app-map',
  imports: [],
  templateUrl: './app-map.html',
  styleUrl: './app-map.css',
})
export class AppMap implements AfterViewInit {
  private map: any;

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

}