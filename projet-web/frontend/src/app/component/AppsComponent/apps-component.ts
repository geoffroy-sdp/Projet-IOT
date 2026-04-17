import { Component, EventEmitter, input, InputSignal, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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

  constructor(public sanitizer: DomSanitizer) {}

  getSafeSvg() {
    return this.sanitizer.bypassSecurityTrustHtml(this.button().svg);
  }

  onButtonClick() {
    this.buttonClicked.emit();
  }
}
