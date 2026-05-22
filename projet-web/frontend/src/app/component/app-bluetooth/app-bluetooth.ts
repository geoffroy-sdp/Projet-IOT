import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phone } from './phone/phone';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-app-bluetooth',
  standalone: true,
  imports: [CommonModule, Phone],
  templateUrl: './app-bluetooth.html',
  styleUrl: './app-bluetooth.css',
})
export class AppBluetooth implements OnInit {
  appareils: any[] = [];
  chargement = true;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getBluetooth().subscribe({
      next: (response) => {
        this.appareils = response.data;
        this.chargement = false;
      },
      error: () => this.chargement = false
    });
  }
}