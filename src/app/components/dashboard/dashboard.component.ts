import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { User, Quiz } from '../../../models/quiz.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  availableQuizzes: Quiz[] = [];

  constructor(
    private authService: AuthService,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    this.quizService.getQuizzes().subscribe((quizzes: Quiz[]) => {
      this.availableQuizzes = quizzes;
    });
  }

  calculateAverageScore(): number {
    return Math.floor(Math.random() * 40) + 60;
  }

  getRecommendedQuizzes(): Quiz[] {
    return this.availableQuizzes.slice(0, 3);
  }

  getThemeIcon(theme: string): string {
    const icons = {
      'technique': '💻',
      'culture': '🏢',
      'ludique': '🎉'
    };
    return icons[theme as keyof typeof icons] || '📚';
  }
}
