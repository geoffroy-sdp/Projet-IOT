import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-signup.html',
  styleUrls: ['./app-signup.css']
})
export class AppSignup {
  @Output() signupSuccess = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();

  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  firstName: string = '';
  lastName: string = '';
  agreeTerms: boolean = false;
  isLoading: boolean = false;
  signupError: string = '';
  passwordError: string = '';

  constructor(private authService: AuthService) {}

  signup() {
    this.signupError = '';
    this.passwordError = '';

    // Validation
    if (!this.firstName.trim()) {
      this.signupError = 'Le prénom est requis';
      return;
    }

    if (!this.lastName.trim()) {
      this.signupError = 'Le nom est requis';
      return;
    }

    if (!this.username.trim()) {
      this.signupError = 'Le nom d\'utilisateur est requis';
      return;
    }

    if (!this.email.includes('@')) {
      this.signupError = 'Email invalide';
      return;
    }

    if (this.password.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (!this.agreeTerms) {
      this.signupError = 'Vous devez accepter les conditions d\'utilisation';
      return;
    }

    this.isLoading = true;

    // Appel à l'API d'inscription
    this.authService.register(
      this.email,
      this.username,
      this.password,
      this.firstName,
      this.lastName
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.authService.saveToken(response.data.token);
          this.authService.saveRefreshToken(response.data.refreshToken);
          this.authService.saveUserId(response.data.userId);
          this.authService.saveUsername(response.data.username);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', this.email);

          this.isLoading = false;
          this.signupSuccess.emit();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.signupError = error.error?.message || 'Erreur lors de la création du compte';
        console.error('Erreur d\'inscription:', error);
      }
    });
  }

  onBackClick() {
    this.backToLogin.emit();
  }
}

