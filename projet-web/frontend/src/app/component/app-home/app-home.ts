import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  homeData: any = null;

  ngOnInit() {
    // Initialiser les données de l'accueil
    this.loadHomeData();
  }

  loadHomeData() {
    // Charger les données de l'accueil depuis le stockage local
    const savedHomeData = localStorage.getItem('homeData');
    if (savedHomeData) {
      this.homeData = JSON.parse(savedHomeData);
    }
  }
}
