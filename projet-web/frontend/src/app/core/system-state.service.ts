import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SystemStateService {
  // Tracks high-level system state (battery, network, etc.)
  getState() {
    return {
      battery: null,
      network: null,
    };
  }
}
