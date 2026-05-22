import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-phone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phone.html',
  styleUrl: './phone.css',
})
export class Phone {
  @Input() deviceName: string = '';
  @Input() macAddress: string = '';
  @Input() connectedAt: string = '';
}