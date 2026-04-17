import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-login.html',
  styleUrl: './app-login.css',
})
export class AppLogin implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() signupClick = new EventEmitter<void>();
  @Output() forgotPasswordClick = new EventEmitter<void>();

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loginError: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Vérifier si l'utilisateur se souvient de lui
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  login() {
    this.loginError = '';
    this.isLoading = true;

    if (!this.email || !this.password) {
      this.loginError = 'Veuillez remplir tous les champs';
      this.isLoading = false;
      return;
    }

    // Validation simple de l'email
    if (!this.isValidEmail(this.email)) {
      this.loginError = 'Email invalide';
      this.isLoading = false;
      return;
    }

    // Appel à l'API de connexion
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          // Stocker le token et l'ID utilisateur
          this.authService.saveToken(response.data.token);
          this.authService.saveUserId(response.data.userId);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', this.email);
          
          if (this.rememberMe) {
            localStorage.setItem('savedEmail', this.email);
          } else {
            localStorage.removeItem('savedEmail');
          }

          this.isLoading = false;
          console.log('Connexion réussie pour:', this.email);
          this.loginSuccess.emit();
        } else {
          this.loginError = 'Erreur de connexion';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.loginError = error.error?.message || 'Identifiants invalides. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  resetForm() {
    this.email = '';
    this.password = '';
    this.rememberMe = false;
    this.loginError = '';
  }

  onSignupClick() {
    this.signupClick.emit();
  }

  onForgotPasswordClick() {
    this.forgotPasswordClick.emit();
  }
}
