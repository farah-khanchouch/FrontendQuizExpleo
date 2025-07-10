import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.css']
})
export class QuizListComponent implements OnInit {
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  selectedTheme: string = '';
  isLoading = true;

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.filteredQuizzes = quizzes;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterByTheme(theme: string): void {
    this.selectedTheme = theme;
    if (theme === '') {
      this.filteredQuizzes = this.quizzes;
    } else {
      this.filteredQuizzes = this.quizzes.filter(quiz => quiz.theme === theme);
    }
  }

  getQuizCountByTheme(theme: string): number {
    return this.quizzes.filter(quiz => quiz.theme === theme).length;
  }

  getThemeIcon(theme: string): string {
    const icons = {
      'technique': '💻',
      'culture': '🏢',
      'ludique': '🎉'
    };
    return icons[theme as keyof typeof icons] || '📚';
  }

  getThemeLabel(theme: string): string {
    const labels = {
      'technique': 'Technique',
      'culture': 'Culture',
      'ludique': 'Ludique'
    };
    return labels[theme as keyof typeof labels] || 'Général';
  }
}
