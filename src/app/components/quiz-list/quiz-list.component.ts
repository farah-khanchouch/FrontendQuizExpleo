import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';
import { AuthService } from '../../services/auth.service';

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
  userQuizzes: Quiz[] = [];
  constructor(private quizService: QuizService, private router: Router, public authService: AuthService) {}
  ngOnInit() {
    console.log('INIT QUIZ LIST COMPONENT'); // tout en haut
  
    const user = this.authService.getCurrentUser();
    console.log('USER:', user);
  
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        console.log('QUIZZES:', quizzes);
  
        if (user && user.cbu) {
          const filtered = quizzes.filter(q =>
            q.status === 'active' &&
            Array.isArray(q.cbus) &&
            q.cbus.map(c => c.trim().toLowerCase()).includes(user.cbu!.trim().toLowerCase())
          );
          console.log('FILTERED:', filtered);
          this.userQuizzes = filtered;
        } else {
          console.log('NO USER OR NO CBU');
          this.userQuizzes = [];
        }
      },
      error: (err) => {
        console.error('ERROR GETTING QUIZZES:', err);
      }
    });
  
    console.log('END OF ngOnInit'); // tout en bas
  }
  getQuizQuestionsCount(quiz: Quiz): number {
    return Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questions as any || 0);
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
  navigateToQuiz(quizId: string): void {
    this.router.navigate(['/quiz', quizId]);
  }
 

 
}
