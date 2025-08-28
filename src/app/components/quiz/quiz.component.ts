import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuizService } from '../../services/quiz.service';
import { Quiz, Question, QuizResult, Badge } from '../../../models/quiz.model';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

export type QuestionType = 'qcm' | 'vrai-faux' | 'libre';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FormsModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})

export class QuizComponent implements OnInit, OnDestroy {
  quiz: Quiz | null = null;
  currentQuestionIndex = 0;
  selectedAnswer: string | string[] | number = '';
  showResult = false;
  showHint = false;
  answers: { [questionId: string]: string | string[] | number } = {};
  score = 0;
  pointsEarned = 0;
  correctAnswers = 0;
  isLoading = true;
  timeRemaining = 0;
  startTime = new Date();
  timeSpent: number = 0;
  private timerSubscription?: Subscription;
  earnedBadges: Badge[] = [];

  // Properties dynamiques selon votre modèle
  badge?: string;
  badgeClass?: string;
  status?: string;
  duration?: string;
  questions?: number;
  description?: string;
  title?: string;

  hasCompletedQuiz = false;
  canReplay = true; // Par défaut, autoriser à rejouer

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) { }

  ngOnInit(): void {
    const quizId = this.route.snapshot.params['quizId'] || this.route.snapshot.params['id'];
    console.log('quizId from route:', quizId);
    this.loadQuiz(quizId);
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  loadQuiz(quizId: string): void {
    this.isLoading = true;
    this.quizService.getQuizById(quizId).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        // Vérifier si l'utilisateur a déjà complété ce quiz
        this.quizService.hasUserCompletedQuiz(quizId).subscribe({
          next: (result) => {
            this.hasCompletedQuiz = result.completed;
            this.canReplay = quiz.isReplayable || !this.hasCompletedQuiz;
            this.isLoading = false;

            // Si l'utilisateur a déjà complété le quiz et qu'il n'est pas rejouable, rediriger
            if (this.hasCompletedQuiz && !this.canReplay) {
              this.router.navigate(['/quiz', quizId, 'completed']);
              return;
            }

            // Initialiser le quiz
            this.initializeQuiz();
          },
          error: (error) => {
            console.error('Erreur lors de la vérification du statut du quiz:', error);
            this.isLoading = false;
            // En cas d'erreur, on laisse l'utilisateur continuer
            this.initializeQuiz();
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement du quiz:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeQuiz(): void {
    if (!this.quiz) return;

    this.timeRemaining = this.quiz.duration * 60; // Convertir en secondes
    this.startTimer();

    // Charger les questions créées par l'admin pour ce quiz
    this.quizService.getQuestionsByQuiz(this.quiz.id).subscribe(
      (questions: Question[]) => {
        this.quiz!.questions = questions;
        this.isLoading = false;
        if (this.currentQuestion?.type === 'vrai-faux' && (!this.currentQuestion.options || this.currentQuestion.options.length === 0)) {
          this.currentQuestion.options = ['Vrai', 'Faux'];
        }

      },
      () => {
        this.isLoading = false;
        this.router.navigate(['/quizzes']);
      }
    );
  }

  // Méthodes utilitaires pour le template
  isArray(val: any): boolean {
    return Array.isArray(val);
  }


  includes(arr: any, value: any): boolean {
    return Array.isArray(arr) && arr.includes(value);
  }

  join(arr: any, sep: string = ', '): string {
    return Array.isArray(arr) ? arr.join(sep) : arr?.toString();
  }

  // Méthode pour vérifier si une question a un indice
  hasHint(question: Question): boolean {
    return !!(question as any).hint;
  }

  // Méthode pour obtenir l'indice d'une question
  getHint(question: Question): string {
    return (question as any).hint || '';
  }

  // Méthode pour obtenir la longueur de la réponse sélectionnée
  getSelectedAnswerLength(): number {
    if (!this.selectedAnswer && this.selectedAnswer !== 0) return 0;
    return this.selectedAnswer.toString().length;
  }

  // Méthode pour vérifier si une option QCM est correcte
  isOptionCorrect(option: string, optionIndex: number): boolean {
    if (!this.currentQuestion) return false;

    const correctAnswer = this.currentQuestion.correctAnswer;

    if (typeof correctAnswer === 'number') {
      return optionIndex === correctAnswer;
    }

    if (Array.isArray(correctAnswer)) {
      // Si c'est un tableau d'index
      if (correctAnswer.every(ans => typeof ans === 'number')) {
        return correctAnswer.includes(optionIndex);
      }
      // Si c'est un tableau de textes
      return correctAnswer.includes(optionIndex);
    }

    if (typeof correctAnswer === 'string') {
      return option === correctAnswer;
    }

    return false;
  }

  // Méthode pour vérifier si une option est sélectionnée
  isOptionSelected(option: string, optionIndex: number): boolean {
    if (this.currentQuestion?.type === 'qcm') {
      return this.selectedAnswer === optionIndex;
    }
    return this.selectedAnswer === option;
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.finishQuiz();
      }
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): Question {
    return this.quiz!.questions[this.currentQuestionIndex];
  }

  getProgressPercentage(): number {
    if (!this.quiz) return 0;
    return Math.round(((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100);
  }

  getScorePercentage(): number {
    if (!this.quiz || !this.quiz.points) return 0;
    return Math.round((this.pointsEarned / this.quiz.points) * 100);
  }

  getTypeLabel(type: QuestionType): string {
    switch (type) {
      case 'qcm': return 'QCM';
      case 'vrai-faux': return 'Vrai/Faux';
      case 'libre': return 'Réponse Libre';
      default: return '';
    }
  }

  getTypeBadgeClass(type: QuestionType): string {
    switch (type) {
      case 'qcm': return 'mcq';
      case 'vrai-faux': return 'tf';
      case 'libre': return 'sa';
      default: return '';
    }
  }

  getTypeIcon(type: QuestionType): string {
    switch (type) {
      case 'qcm': return '📝';
      case 'vrai-faux': return '✓✗';
      case 'libre': return '💭';
      default: return '';
    }
  }

  selectAnswer(answer: string | string[] | number, optionIndex?: number): void {
    if (!this.showResult) {
      // Pour les QCM, stocker l'index de l'option plutôt que le texte
      if (this.currentQuestion?.type === 'qcm' && optionIndex !== undefined) {
        this.selectedAnswer = optionIndex;
      } else {
        this.selectedAnswer = answer;
      }
    }
  }

  onShortAnswerChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedAnswer = target.value;
  }

  isAnswerCorrect(): boolean {
    if (!this.currentQuestion) return false;
    const correctAnswer = this.currentQuestion.correctAnswer;

    // Si pas de réponse sélectionnée
    if (this.selectedAnswer === null || this.selectedAnswer === undefined) {
      return false;
    }

    if (this.currentQuestion.type === 'qcm') {
      // Pour QCM, comparer les index
      if (typeof correctAnswer === 'number' && typeof this.selectedAnswer === 'number') {
        return this.selectedAnswer === correctAnswer;
      }
      // Si correctAnswer est un tableau de nombres
      if (Array.isArray(correctAnswer) && typeof this.selectedAnswer === 'number') {
        return correctAnswer.includes(this.selectedAnswer);
      }
      // Si correctAnswer est du texte, comparer avec le texte de l'option sélectionnée
      if (typeof correctAnswer === 'string' && typeof this.selectedAnswer === 'number') {
        const selectedOption = this.currentQuestion.options?.[this.selectedAnswer];
        return selectedOption === correctAnswer;
      }
    }

    if (this.currentQuestion.type === 'vrai-faux') {
      // Normaliser la réponse de l'utilisateur
      const userAnswer = String(this.selectedAnswer).toLowerCase();
      const isUserTrue = userAnswer === 'vrai' || userAnswer === 'true';

      // Normaliser la réponse correcte
      const correctAnswerStr = String(correctAnswer).toLowerCase();
      const isCorrectTrue = correctAnswerStr === 'vrai' || correctAnswerStr === 'true' || correctAnswer === true;

      return isUserTrue === isCorrectTrue;
    }

    if (this.currentQuestion.type === 'libre') {
      // Réponse libre : comparer les chaînes (insensible à la casse et aux espaces)
      if (typeof this.selectedAnswer === 'string' && typeof correctAnswer === 'string') {
        return this.selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }
    }

    return false;
  }

  submitAnswer(): void {
    // Check for null/undefined/empty string (but allow 0)
    if (this.selectedAnswer === null ||
      this.selectedAnswer === undefined ||
      (typeof this.selectedAnswer === 'string' && this.selectedAnswer.trim() === '') ||
      !this.currentQuestion) {
      return;
    }

    // Debug pour comprendre le problème
    console.log('=== DEBUG SUBMIT ANSWER ===');
    console.log('Selected Answer:', this.selectedAnswer, 'Type:', typeof this.selectedAnswer);
    console.log('Correct Answer:', this.currentQuestion.correctAnswer, 'Type:', typeof this.currentQuestion.correctAnswer);
    console.log('Question Type:', this.currentQuestion.type);
    console.log('Options:', this.currentQuestion.options);
    console.log('Is Correct:', this.isAnswerCorrect());
    console.log('=========================');

    this.showResult = true;
    if (this.currentQuestion.id !== undefined) {
      this.answers[this.currentQuestion.id] = this.selectedAnswer;
    }

    if (this.isAnswerCorrect()) {
      this.pointsEarned += this.currentQuestion.points;
      this.correctAnswers++;
    }
  }

  nextQuestion(): void {
    this.currentQuestionIndex++;
    this.selectedAnswer = '';
    this.showResult = false;
    this.showHint = false;
    // À placer juste après l'affichage de la nouvelle question (après currentQuestionIndex++)
    if (this.currentQuestion?.type === 'vrai-faux' && (!this.currentQuestion.options || this.currentQuestion.options.length === 0)) {
      this.currentQuestion.options = ['Vrai', 'Faux'];
    }
  }

  isLastQuestion(): boolean {
    return this.quiz ? this.currentQuestionIndex === this.quiz.questions.length - 1 : false;
  }

  isQuestionCorrect(questionId: string): boolean {
    const question = this.quiz?.questions.find(q => q.id === questionId);
    if (!question) return false;

    const userAnswer = this.answers[questionId];
    if (userAnswer === undefined && userAnswer !== 0) return false;

    const correctAnswer = question.correctAnswer;

    // Handle different question types
    if (question.type === 'qcm') {
      // For QCM, compare indexes or values based on correctAnswer type
      if (typeof correctAnswer === 'number' && typeof userAnswer === 'number') {
        return userAnswer === correctAnswer;
      }
      // If correctAnswer is an array of numbers
      if (Array.isArray(correctAnswer) && typeof userAnswer === 'number') {
        return correctAnswer.some(ans => ans === userAnswer);
      }
      // If correctAnswer is a string, compare with selected option text
      if (typeof correctAnswer === 'string' && typeof userAnswer === 'number') {
        const selectedOption = question.options?.[userAnswer];
        return selectedOption === correctAnswer;
      }
    }

    if (question.type === 'vrai-faux') {
      const user = userAnswer === 'Vrai' ? true : userAnswer === 'Faux' ? false : userAnswer;
      const correct = correctAnswer === true || correctAnswer === 'Vrai' ? true : false;
      return user === correct;
    }

    // For free text answers
    if (question.type === 'libre') {
      if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }
    }

    return false;
  }

  finishQuiz(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.quiz) {
      const quizResult: QuizResult = {
        userId: '', // À remplir avec l'ID de l'utilisateur connecté
        quizId: this.quiz.id,
        score: this.pointsEarned,
        totalQuestions: this.quiz.questionCount,
        correctAnswers: this.correctAnswers,
        pointsEarned: this.pointsEarned,
        completedAt: new Date(),
        badges: this.earnedBadges
      };

      const formattedAnswers: { [questionId: string]: string | number } = {};
      Object.keys(this.answers).forEach(qid => {
        const ans = this.answers[qid];
        formattedAnswers[qid] = Array.isArray(ans) ? ans.join(',') : ans;
      });

      this.quizService.submitQuizResult(this.quiz.id, formattedAnswers).subscribe({
        next: (result) => {
          // Si le service retourne des badges gagnés
          if (result && result.badges) {
            this.earnedBadges = result.badges;
          }
          this.timeSpent = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
          this.router.navigate(['/results', this.quiz!.id], {
            queryParams: {
              score: this.pointsEarned,
              correctAnswers: this.correctAnswers,
              totalQuestions: this.quiz!.questions.length,
              time: this.timeSpent
            }
          });
        },
        error: (error) => {
          console.error('Erreur lors de la soumission du quiz:', error);
        }
      });
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  isTFOptionCorrect(option: string): boolean {
    if (!this.currentQuestion) return false;

    // Convertir la réponse correcte en booléen
    const correctAnswer = this.currentQuestion.correctAnswer;
    const isCorrect = String(correctAnswer).toLowerCase() === 'vrai' ||
      String(correctAnswer).toLowerCase() === 'true' ||
      correctAnswer === true;

    // Retourne true si l'option sélectionnée correspond à la réponse correcte
    return (option === 'Vrai' && isCorrect) ||
      (option === 'Faux' && !isCorrect);
  }
}