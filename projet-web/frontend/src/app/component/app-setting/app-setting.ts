import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-setting',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-setting.html',
  styleUrl: './app-setting.css',
})
export class AppSetting implements OnInit {
  isDarkMode: boolean = false;

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
}
