import { Component } from '@angular/core';
import { button } from './class/itemsbutton.class';
import { AppComponent } from './component/AppsComponent/apps-component';

@Component({
  selector: 'app-root',
  imports: [AppComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  button1!: button;
  button2!: button;
  button3!: button;
  button4!: button;
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

}
