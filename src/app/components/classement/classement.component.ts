import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-classement',
  templateUrl: './classement.component.html',
  styleUrls: ['./classement.component.css'],
  imports: [
    NavbarComponent,
    CommonModule,
  ],
})
export class ClassementComponent {
  leaderboard = [
    {
      rank: 1,
      name: 'Marie Martin',
      role: 'Développeur Senior',
      score: 2450,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
      medal: '🥇',
      podium: 'first'
    },
    {
      rank: 2,
      name: 'Pierre Dubois',
      role: 'Tech Lead',
      score: 2320,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
      medal: '🥈',
      podium: 'second'
    },
    {
      rank: 3,
      name: 'Jean Dupont (Vous)',
      role: 'Développeur Senior',
      score: 2180,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
      medal: '🥉',
      podium: 'third',
      currentUser: true
    },
    {
      rank: 4,
      name: 'Sophie Laurent',
      role: 'Développeur Junior',
      score: 1950,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'
    }
  ];

  constructor() { }
}