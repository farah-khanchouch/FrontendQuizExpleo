import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuizService } from '../../services/quiz.service';
import { Quiz, Question } from '../../../models/quiz.model';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  quiz: Quiz | null = null;
  currentQuestionIndex = 0;
  selectedAnswer = '';
  showResult = false;
  answers: { [questionId: string]: string } = {};
  score = 0;
  isLoading = true;
  badge?: string;
  badgeClass?: string;
  status?: string;
  duration?: string;
  questions?: number;
  description?: string;
  title?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    const quizId = this.route.snapshot.params['id'];
    this.loadQuiz(quizId);
  }

  loadQuiz(quizId: string): void {
    this.quizService.getQuizById(quizId).subscribe(
      (quiz: Quiz | undefined) => {
        this.quiz = quiz || null;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
        this.router.navigate(['/quizzes']);
      }
    );
  }

  get currentQuestion(): Question {
    return this.quiz!.questions[this.currentQuestionIndex];
  }

  getProgressPercentage(): number {
    if (!this.quiz) return 0;
    return Math.round(((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100);
  }

  selectAnswer(answer: string): void {
    if (!this.showResult) {
      this.selectedAnswer = answer;
    }
  }

  submitAnswer(): void {
    if (!this.selectedAnswer) return;

    this.showResult = true;
    this.answers[this.currentQuestion.id] = this.selectedAnswer;

    if (this.selectedAnswer === this.currentQuestion.correctAnswer) {
      this.score += this.currentQuestion.points;
    }
  }

  nextQuestion(): void {
    this.currentQuestionIndex++;
    this.selectedAnswer = '';
    this.showResult = false;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.quiz!.questions.length - 1;
  }

  finishQuiz(): void {
    if (this.quiz) {
      this.quizService.submitQuizResult(this.quiz.id, this.answers).subscribe({
        next: () => {
          this.router.navigate(['/results', this.quiz!.id], {
            queryParams: { score: this.score }
          });
        }
      });
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }
}
