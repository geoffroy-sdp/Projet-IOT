import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    userId: string;
  };
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface RegisterResponse {
  success: boolean;
  data: {
    email: string;
    username: string;
    userId: string;
    token: string;
    refreshToken: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/users/login`,
      { email, password }
    );
  }

  register(email: string, username: string, password: string, firstName: string, lastName: string) {
    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/users/register`,
      { email, username, password, firstName, lastName }
    );
  }

  saveToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  saveRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  saveUserId(userId: string) {
    localStorage.setItem('userId', userId);
  }

  saveUsername(username: string) {
    localStorage.setItem('username', username);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
  }
}
