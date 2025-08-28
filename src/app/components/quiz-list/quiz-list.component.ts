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
  
  // Nouvelle propriété pour stocker les statuts de complétion
  quizCompletionStatus: { [quizId: string]: { completed: boolean, lastAttempt?: Date } } = {};

  constructor(
    private quizService: QuizService, 
    private router: Router, 
    public authService: AuthService
  ) { }

  ngOnInit() {
    console.log('INIT QUIZ LIST COMPONENT');

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
          
          // Charger les statuts de complétion pour chaque quiz
          this.loadQuizCompletionStatuses();
        } else {
          console.log('NO USER OR NO CBU');
          this.userQuizzes = [];
        }
      },
      error: (err) => {
        console.error('ERROR GETTING QUIZZES:', err);
      }
    });

    console.log('END OF ngOnInit');
  }

  // Nouvelle méthode pour charger les statuts de complétion
  loadQuizCompletionStatuses(): void {
    this.userQuizzes.forEach(quiz => {
      const quizId = quiz.id || quiz._id;
      this.quizService.hasUserCompletedQuiz(quizId).subscribe({
        next: (status) => {
          this.quizCompletionStatus[quizId] = status;
        },
        error: (err) => {
          console.error(`Erreur lors de la vérification du statut pour le quiz ${quizId}:`, err);
          // En cas d'erreur, on considère que le quiz n'a pas été complété
          this.quizCompletionStatus[quizId] = { completed: false };
        }
      });
    });
  }

  // Nouvelle méthode pour déterminer le texte du bouton
  getButtonText(quiz: Quiz): string {
    const quizId = quiz.id || quiz._id;
    const completionStatus = this.quizCompletionStatus[quizId];

    if (!completionStatus || !completionStatus.completed) {
      return 'Commencer';
    }

    // Si le quiz est complété
    if (quiz.isReplayable) {
      return 'Refaire';
    } else {
      return 'Terminé';
    }
  }

  // Nouvelle méthode pour déterminer si le bouton doit être cliquable
  isButtonClickable(quiz: Quiz): boolean {
    const quizId = quiz.id || quiz._id;
    const completionStatus = this.quizCompletionStatus[quizId];

    // Si pas encore complété, toujours cliquable
    if (!completionStatus || !completionStatus.completed) {
      return true;
    }

    // Si complété, cliquable seulement si rejouable
    return quiz.isReplayable ?? true; // Par défaut true si non défini
  }

  // Nouvelle méthode pour déterminer la classe CSS du bouton
  getButtonClass(quiz: Quiz): string {
    const quizId = quiz.id || quiz._id;
    const completionStatus = this.quizCompletionStatus[quizId];

    if (!completionStatus || !completionStatus.completed) {
      return 'btn btn-primary';
    }

    // Si complété
    if (quiz.isReplayable) {
      return 'btn btn-secondary'; // Style pour "Refaire"
    } else {
      return 'btn btn-disabled'; // Style pour "Terminé" (non cliquable)
    }
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
    // Vérifier si la navigation est autorisée avant de naviguer
    const quiz = this.userQuizzes.find(q => (q.id || q._id) === quizId);
    if (quiz && this.isButtonClickable(quiz)) {
      this.router.navigate(['/quiz', quizId]);
    }
  }
}