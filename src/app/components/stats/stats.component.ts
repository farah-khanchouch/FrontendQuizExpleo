import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
  imports: [ NavbarComponent,CommonModule],
})
export class StatsComponent {
  bestResults = [
    { subject: 'JavaScript', score: 95 },
    { subject: 'React', score: 88 },
    { subject: 'TypeScript', score: 92 }
  ];

  constructor() { }
}