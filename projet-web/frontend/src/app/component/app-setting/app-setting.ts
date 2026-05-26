import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-setting',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-setting.html',
  styleUrl: './app-setting.css',
})
export class AppSetting implements OnInit {
  isDarkMode: boolean = false;
  @Output() logoutClick = new EventEmitter<void>();

  ngOnInit() {
    // Récupérer le mode sombre du localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyDarkMode();
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    this.applyDarkMode();
  }

  applyDarkMode() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  logout() {
    try {
      // Nettoyer tous les tokens et données d'authentification
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('savedEmail');
      
      console.log('Déconnexion réussie');
      
      // Émettre l'événement de déconnexion au composant parent
      this.logoutClick.emit();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
}