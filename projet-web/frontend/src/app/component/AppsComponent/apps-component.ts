import { Component, InputSignal, input, Output, EventEmitter } from '@angular/core';
import { button } from '../../class/itemsbutton.class';

@Component({
  selector: 'box-buttons',
  imports: [],
  templateUrl: './apps-component.html',
  styleUrl: './apps-component.css',
})
export class AppComponent {
    button: InputSignal<button> = input(new button(), {
  alias: 'my-button',})
  @Output() buttonClicked = new EventEmitter<void>();

  onButtonClick() {
    this.buttonClicked.emit();
  }
}
