import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { button } from './class/itemsbutton.class';
import { AppComponent } from './component/AppsComponent/apps-component';
import { AppBluetooth } from './component/app-bluetooth/app-bluetooth';
import { AppHome } from './component/app-home/app-home';
import { AppMap } from './component/app-map/app-map';
import { AppMusic } from './component/app-music/app-music';
import { AppSetting } from './component/app-setting/app-setting';

@Component({
  selector: 'app-root',
  imports: [AppComponent, AppHome, AppSetting, AppMap, AppMusic, AppBluetooth, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  button1!: button;
  button2!: button;
  button3!: button;
  button4!: button;
  currentPage: string = 'home';

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
