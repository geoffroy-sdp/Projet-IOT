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
  button!: button;

  constructor() {
    this.button = new button();
    this.button.str = "/img/map.png";
  }
}
