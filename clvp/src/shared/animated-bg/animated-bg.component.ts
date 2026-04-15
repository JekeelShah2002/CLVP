import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-bg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-bg.component.html',
  styleUrls: ['./animated-bg.component.css']
})
export class AnimatedBgComponent {
  particles = Array.from({ length: 12 }, (_, i) => i + 1);
}
