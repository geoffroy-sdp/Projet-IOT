import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { button } from './class/itemsbutton.class';
import { AppComponent } from './component/AppsComponent/apps-component';
import { AppBluetooth } from './component/app-bluetooth/app-bluetooth';
import { AppHome } from './component/app-home/app-home';
import { AppMap } from './component/app-map/app-map';
import { AppMusic } from './component/app-music/app-music';
import { AppSetting } from './component/app-setting/app-setting';
import { AppLogin } from './component/app-login/app-login';
import { AppSignup } from './component/app-signup/app-signup';
import { AppForgotPassword } from './component/app-forgot-password/app-forgot-password';

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
    this.deleteLocalStorage();
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
    this.button1.str = "/img/map.svg";
    this.button2 = new button();
    this.button2.str = "/img/music-alt.svg";
    this.button3 = new button();
    this.button3.str = "/img/bluetooth.svg";
    this.button4 = new button();
    this.button4.str = "/img/gear.svg";
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
}
