import { Component, InputSignal, input } from '@angular/core';
import { button } from '../../class/itemsbutton.class';

@Component({
  selector: 'box-apps',
  imports: [],
  templateUrl: './apps-component.html',
  styleUrl: './apps-component.css',
})
export class AppComponent {
    button: InputSignal<button> = input(new button(), {
  alias: 'my-button',})
}
