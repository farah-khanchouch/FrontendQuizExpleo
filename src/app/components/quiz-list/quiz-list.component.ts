import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  editingQuiz: Quiz | null = null;
  showEditModal = false;
  constructor(private quizService: QuizService,  private router: Router) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.isLoading = true;
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.filteredQuizzes = quizzes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des quiz:', error);
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

 

 
}
