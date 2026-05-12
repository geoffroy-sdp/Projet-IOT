import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { button } from './class/itemsbutton.class';
import { AppComponent } from './component/AppsComponent/apps-component';
import { AppBluetooth } from './component/app-bluetooth/app-bluetooth';
import { AppForgotPassword } from './component/app-forgot-password/app-forgot-password';
import { AppHome } from './component/app-home/app-home';
import { AppLogin } from './component/app-login/app-login';
import { AppMap } from './component/app-map/app-map';
import { AppMusic } from './component/app-music/app-music';
import { AppSetting } from './component/app-setting/app-setting';
import { AppSignup } from './component/app-signup/app-signup';

@Component({
  selector: 'app-root',
  imports: [AppComponent, AppHome, AppSetting, AppMap, AppMusic, AppBluetooth, AppLogin, AppSignup, AppForgotPassword, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  button1!: button;
  button2!: button;
  button3!: button;
  button4!: button;
  currentPage: string = 'login';
  isLoggedIn: boolean = false;
  authPage: 'login' | 'signup' | 'forgot-password' = 'login';

  ngOnInit() {
    this.checkAuthentication();
  }

  deleteLocalStorage() {
    localStorage.clear();
  }

  checkAuthentication() {
    //this.deleteLocalStorage();
    const loggedIn = localStorage.getItem('isLoggedIn');
    this.isLoggedIn = loggedIn === 'true';
    
    if (!this.isLoggedIn) {
      this.currentPage = 'login';
    } else {
      this.currentPage = 'home';
    }
  }

  handleLogin() {
    this.isLoggedIn = true;
    this.currentPage = 'home';
  }

  handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    this.isLoggedIn = false;
    this.currentPage = 'login';
    this.authPage = 'login';
  }

  goToSignup() {
    this.authPage = 'signup';
  }

  goToForgotPassword() {
    this.authPage = 'forgot-password';
  }

  goToLogin() {
    this.authPage = 'login';
  }

  handleSignupSuccess() {
    this.authPage = 'login';
  }

  handleResetSuccess() {
    this.authPage = 'login';
  }

  constructor() {
    this.button1 = new button();
    this.button1.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="m21.51 6.14-5-3a.99.99 0 0 0-.87-.08L8.09 5.89 3.51 3.14a.99.99 0 0 0-1.01-.01c-.31.18-.51.51-.51.87v13c0 .35.18.68.49.86l5 3c.26.16.58.19.87.08l7.55-2.83 4.59 2.75c.16.1.34.14.51.14s.34-.04.49-.13c.31-.18.51-.51.51-.87V7a.99.99 0 0 0-.49-.86M7 18.23l-3-1.8V5.77l3 1.8v10.67Zm8-1.93-6 2.25V7.69l6-2.25zm5 1.93-3-1.8V5.77l3 1.8v10.67Z"></path></svg>`;
    
    this.button2 = new button();
    this.button2.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="m21.32 6.05-12-4A1.01 1.01 0 0 0 8 3v7.56c-.59-.34-1.27-.56-2-.56-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V4.39l10 3.33v6.84c-.59-.34-1.27-.56-2-.56-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7c0-.43-.28-.81-.68-.95M6 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m12 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2"></path></svg>`;
    
    this.button3 = new button();
    this.button3.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 7.47a.97.97 0 0 0-.46-.81l-7-4.5c-.31-.2-.7-.21-1.02-.04-.32.18-.52.51-.52.88v6.42L5.59 6.2 4.41 7.82 10 11.9v.21l-5.59 4.08 1.18 1.62L10 14.59v6.42c0 .37.2.7.52.88a1 1 0 0 0 1.02-.04l7-4.5c.28-.18.45-.48.46-.81 0-.33-.14-.64-.41-.84l-5.05-3.69 5.05-3.69c.27-.19.42-.51.41-.84Zm-2.77 8.98L12 19.17v-5.81zM12 10.65V4.84l4.23 2.72z"></path></svg>`;
    
    this.button4 = new button();
    this.button4.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12.5v-1h-1.03c-.04-.78-.18-1.54-.41-2.26l.95-.37-.36-.93-.95.37c-.38-.85-.89-1.62-1.5-2.3l.73-.73-.71-.71-.73.73c-.57-.51-1.2-.95-1.89-1.3l.42-.93-.91-.41-.42.94a8.9 8.9 0 0 0-2.69-.57V2h-1v1.03c-.78.04-1.54.18-2.26.41l-.37-.95-.93.36.37.95c-.85.38-1.62.89-2.3 1.5l-.73-.73-.71.71.73.73c-.51.57-.95 1.2-1.3 1.89l-.93-.42-.41.91.94.42a8.9 8.9 0 0 0-.57 2.69H2v1h1.03c.04.78.18 1.54.41 2.26l-.95.37.36.93.95-.37c.38.85.89 1.62 1.5 2.3l-.73.73.71.71.73-.73c.57.51 1.2.95 1.89 1.3l-.42.93.91.41.42-.94a8.9 8.9 0 0 0 2.69.57V22h1v-1.03c.78-.04 1.54-.18 2.26-.41l.37.95.93-.36-.37-.95c.85-.38 1.62-.89 2.3-1.5l.73.73.71-.71-.73-.73c.51-.57.95-1.2 1.3-1.89l.93.42.41-.91-.94-.42a8.9 8.9 0 0 0 .57-2.69zM12 5c3.1 0 5.72 2.02 6.65 4.81l-4.05.71c-.52-.91-1.48-1.53-2.6-1.53-.37 0-.72.08-1.05.2L8.31 6.05a6.9 6.9 0 0 1 3.68-1.06Zm1 7c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1m-4.31 6.17a6.99 6.99 0 0 1-1.9-10.83l2.64 3.14c-.26.45-.42.96-.42 1.51 0 .93.43 1.75 1.1 2.3L8.7 18.15ZM12 19c-.49 0-.97-.05-1.43-.15l1.4-3.85H12a2.99 2.99 0 0 0 2.95-2.5l4.04-.71c0 .07.01.14.01.22 0 3.86-3.14 7-7 7Z"></path></svg>`;
  }

  onButton1Click() {
    this.currentPage = 'map';
  }

  onButton2Click() {
    this.currentPage = 'music';
  }

  onButton3Click() {
    this.currentPage = 'bluetooth';
  }

  onButton4Click() {
    this.currentPage = 'settings';
  }

  onHomeClick() {
    this.currentPage = 'home';
  }

  onHomeNavigation(page: string) {
    this.currentPage = page;
  }
}
