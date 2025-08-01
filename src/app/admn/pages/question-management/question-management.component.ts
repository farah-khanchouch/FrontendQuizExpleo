import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../services/quiz.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Question {
  id?: string;
  type: 'qcm' | 'vrai-faux' | 'libre';
  question: string;
  options?: string[];
  correctAnswer: string | number | string[];
  points: number;
  explanation?: string;
  quizId?: string;
}

export interface NewQuestion {
  type: 'qcm' | 'vrai-faux' | 'libre';
  question: string;
  options?: string[];
  correctAnswer: string | number | string[];
  points: number;
  explanation?: string;
  quizId?: string; 
}

@Component({
  selector: 'app-question-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.css', '../../global_styles.css']
})
export class QuestionManagementComponent implements OnInit {
  quizId!: string;
  quizTitle = 'JavaScript Fundamentals';
  showCreateModal = false;
  editingQuestion: Question | null = null;

  newQuestion: Partial<Question> = {
    type: 'qcm',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    explanation: ''
  };
  questions: Question[] = [];

  constructor(private route: ActivatedRoute,
    private quizService: QuizService,
    private router: Router,
    private http: HttpClient
  ) {}
  private baseUrl = 'http://localhost:3000/api/quizzes';

  ngOnInit() {
    console.log('Route params:', this.route.snapshot.paramMap.keys);
    console.log('All params:', this.route.snapshot.params);
    
    this.quizId = this.route.snapshot.paramMap.get('quizId')!;
    console.log('Retrieved quizId:', this.quizId);
    
    if (!this.quizId) {
      console.error('QuizId is null or undefined!');
      alert('Erreur: ID du quiz non trouvé dans l\'URL');
      return;
    }
  
    this.quizService.getQuestionsByQuiz(this.quizId.toString()).subscribe({
      next: (questions) => {
        this.questions = questions;
      },
      error: (err) => {
        console.error('Erreur chargement questions:', err);
      }
    });
  
    this.quizService.getQuizById(this.quizId.toString()).subscribe({
      next: (quiz) => {
        this.quizTitle = quiz.title;
      }
    });
  }
  
  openCreateModal() {
    this.showCreateModal = true;
    this.newQuestion = {
      type: 'qcm',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: ''
    };
  }

  closeModal() {
    this.showCreateModal = false;
    this.editingQuestion = null;
  }

  onQuestionTypeChange() {
    if (this.editingQuestion) {
      if (this.editingQuestion.type === 'qcm') {
        this.editingQuestion.options = ['', '', '', ''];
        this.editingQuestion.correctAnswer = 0;
      } else if (this.editingQuestion.type === 'vrai-faux') {
        this.editingQuestion.options = undefined;
        this.editingQuestion.correctAnswer = 'true';
      } else {
        this.editingQuestion.options = undefined;
        this.editingQuestion.correctAnswer = '';
      }
    } else {
      if (this.newQuestion.type === 'qcm') {
        this.newQuestion.options = ['', '', '', ''];
        this.newQuestion.correctAnswer = 0;
      } else if (this.newQuestion.type === 'vrai-faux') {
        this.newQuestion.options = undefined;
        this.newQuestion.correctAnswer = 'true';
      } else {
        this.newQuestion.options = undefined;
        this.newQuestion.correctAnswer = '';
      }
    }
  }

  createQuestion(quizId: string, questionData: NewQuestion): Observable<Question> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<Question>(`${this.baseUrl}/${quizId}/questions`, questionData, { headers });
  }

  editQuestion(question: Question) {
    this.editingQuestion = { ...question };
    if (!this.editingQuestion.options && this.editingQuestion.type === 'qcm') {
      this.editingQuestion.options = ['', '', ''];
    } else if (this.editingQuestion.options) {
      this.editingQuestion.options = [...this.editingQuestion.options];
    }
    this.showCreateModal = true;
  }

  updateQuestion() {
    if (this.editingQuestion) {
      const index = this.questions.findIndex(q => q.id === this.editingQuestion!.id);
      if (index !== -1) {
        this.questions[index] = { ...this.editingQuestion };
      }
      this.closeModal();
    }
  }

  deleteQuestion(questionId?: string) {
    if (!questionId) {
      console.warn('deleteQuestion called with undefined questionId');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.quizService.deleteQuestion(questionId).subscribe(() => {
        this.questions = this.questions.filter(q => q.id !== questionId);
      });
    }
  }

  duplicateQuestion(question: Question) {
    const duplicated: Question = {
      ...question,
      question: `${question.question} (Copie)`
    };
    if (duplicated.options) {
      duplicated.options = [...duplicated.options];
    }
    this.questions.push(duplicated);
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'qcm': return 'QCM';
      case 'vrai-faux': return 'Vrai/Faux';
      case 'libre': return 'Réponse courte';
      default: return type;
    }
  }

  addOption() {
    const q = this.getCurrentQuestion();
    if (!q.options) q.options = [];
    q.options.push('');
  }

  removeOption(index: number) {
    const q = this.getCurrentQuestion();
    if (q.options && q.options.length > 2) {
      q.options.splice(index, 1);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getCurrentQuestion(): Partial<Question> {
    return this.editingQuestion ?? this.newQuestion;
  }

  getOptions(): string[] {
    return this.getCurrentQuestion().options ?? [];
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }

  saveAllQuestions() {
    const createRequests = this.questions
      .filter(q => !q.id)
      .map(q => this.quizService.createQuestion(this.quizId.toString(), {
        question: q.question,
        type: q.type,
        options: q.options ?? [],
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation ?? '',
        quizId: this.quizId
      }));

    const updateRequests = this.questions
      .filter(q => q.id)
      .map(q => this.quizService.updateQuestion(q.id!, {
        question: q.question,
        type: q.type,
        options: q.options ?? [],
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation ?? '',
        quizId: this.quizId
      }));

    forkJoin([...createRequests, ...updateRequests]).subscribe({
      next: () => {
        console.log('✅ Toutes les questions ont été enregistrées avec succès.');
        this.router.navigate(['/admin/quiz-management']);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des questions :', error);
        alert('Une erreur est survenue lors de la sauvegarde des questions.');
      }
    });
  }

  saveNewQuestion() {
    console.log('=== DEBUG saveNewQuestion ===');
    console.log('this.quizId:', this.quizId);
    console.log('typeof this.quizId:', typeof this.quizId);
    console.log('this.newQuestion:', this.newQuestion);
    
    if (!this.newQuestion.question || !this.newQuestion.type) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    if (!this.quizId) {
      alert('Erreur: ID du quiz manquant. Impossible de créer la question.');
      return;
    }
    
    // Ensure quizId is set on the new question
    const questionData: NewQuestion = {
      ...this.newQuestion as NewQuestion,
      quizId: this.quizId
    };
    
    console.log('questionData to send:', questionData);
    console.log('URL will be:', `${this.baseUrl}/${this.quizId}/questions`);
    
    this.createQuestion(this.quizId.toString(), questionData).subscribe({
      next: (createdQuestion) => {
        this.questions.push(createdQuestion);
        this.closeModal();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la question:', error);
        alert('Une erreur est survenue lors de la création de la question.');
      }
    });
  }
}