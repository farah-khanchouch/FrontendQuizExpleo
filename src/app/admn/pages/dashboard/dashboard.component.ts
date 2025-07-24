import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', '../../global_styles.css']
})
export class DashboardComponent {
  stats = {
    totalQuizzes: 12,
    activeUsers: 85,
    averageScore: 78,
    totalBadges: 15
  };

  recentActivity = [
    { user: 'Marie Dupont', action: 'Terminé le quiz "JavaScript Basics"', score: 92, time: '2 min' },
    { user: 'Thomas Martin', action: 'Obtenu le badge "Quiz Master"', score: null, time: '5 min' },
    { user: 'Sophie Bernard', action: 'Commencé le quiz "Angular Avancé"', score: null, time: '8 min' },
    { user: 'Lucas Moreau', action: 'Terminé le quiz "CSS Flexbox"', score: 87, time: '12 min' }
  ];

  topPerformers = [
    { name: 'Marie Dupont', score: 94, quizzes: 8, badges: 5 },
    { name: 'Jean-Pierre Leroy', score: 91, quizzes: 12, badges: 7 },
    { name: 'Alice Roux', score: 89, quizzes: 6, badges: 4 },
    { name: 'Paul Durand', score: 86, quizzes: 9, badges: 6 }
  ];
}