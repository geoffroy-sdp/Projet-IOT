import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-forgot-password.html',
  styleUrls: ['./app-forgot-password.css']
})
export class AppForgotPassword {
  @Output() resetSuccess = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();

  email: string = '';
  isLoading: boolean = false;
  error: string = '';
  successMessage: string = '';
  step: 'email' | 'code' | 'password' = 'email';

  resetCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: string = '';

  requestReset() {
    this.error = '';
    this.successMessage = '';

    if (!this.email.includes('@')) {
      this.error = 'Email invalide';
      return;
    }

    this.isLoading = true;

    // Simulation: attendre 1.5s
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = `Un code de réinitialisation a été envoyé à ${this.email}`;
      this.step = 'code';
    }, 1500);
  }

  verifyCode() {
    this.error = '';

    if (!this.resetCode.trim()) {
      this.error = 'Veuillez entrer le code reçu';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = '';
      this.step = 'password';
    }, 1000);
  }

  resetPassword() {
    this.error = '';
    this.passwordError = '';

    if (this.newPassword.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Mot de passe réinitialisé avec succès!';
      setTimeout(() => {
        this.resetSuccess.emit();
      }, 1500);
    }, 1500);
  }

  onBackClick() {
    this.backToLogin.emit();
  }
}
