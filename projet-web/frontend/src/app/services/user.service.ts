import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface GpsPoint {
  _id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  signalQuality: string;
  timestamp: string;
}

export interface GpsListResponse {
  success: boolean;
  data: GpsPoint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // PROFIL
  getProfil() {
    return this.http.get(`${this.apiUrl}/profile`);
  }
  updateProfil(data: any) {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  // GPS
  getGpsList(page = 1, limit = 50) {
    return this.http.get<GpsListResponse>(`${this.apiUrl}/gps?page=${page}&limit=${limit}`);
  }
  getGpsById(id: string) {
    return this.http.get<{ success: boolean; data: GpsPoint }>(`${this.apiUrl}/gps/${id}`);
  }
  addGps(data: Partial<GpsPoint>) {
    return this.http.post(`${this.apiUrl}/gps`, data);
  }
  updateGps(id: string, data: Partial<GpsPoint>) {
    return this.http.put(`${this.apiUrl}/gps/${id}`, data);
  }
  deleteGps(id: string) {
    return this.http.delete(`${this.apiUrl}/gps/${id}`);
  }

  getAdresse(lat: number, lng: number) {
  return this.http.get<any>(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
}

  // SESSIONS
  getSessions() {
    return this.http.get(`${this.apiUrl}/sessions`);
  }
  getSessionById(id: string) {
    return this.http.get(`${this.apiUrl}/sessions/${id}`);
  }
  createSession(data: any) {
    return this.http.post(`${this.apiUrl}/sessions`, data);
  }
  updateSession(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/sessions/${id}`, data);
  }
  deleteSession(id: string) {
    return this.http.delete(`${this.apiUrl}/sessions/${id}`);
  }

  // METADATA
  getMetadata() {
    return this.http.get(`${this.apiUrl}/metadata`);
  }
  updateMetadata(data: any) {
    return this.http.put(`${this.apiUrl}/metadata`, data);
  }

  // EXPORT
  exportData() {
    return this.http.get(`${this.apiUrl}/data/export`);
  }
  // BLUETOOTH
  getBluetooth() {
    return this.http.get<{ success: boolean; data: any[] }>
      (`${environment.apiUrl}/bluetooth`);
  }

  addBluetooth(data: { deviceName: string; macAddress: string; deviceType?: string }) {
    return this.http.post(`${environment.apiUrl}/bluetooth`, data);
  }

  deleteBluetooth(id: string) {
    return this.http.delete(`${environment.apiUrl}/bluetooth/${id}`);
  }
}