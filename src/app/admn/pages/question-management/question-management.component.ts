import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  type: 'qcm' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

@Component({
  selector: 'app-question-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.css', '../../global_styles.css']
})
export class QuestionManagementComponent implements OnInit {
  quizId!: number;
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

  questions: Question[] = [
    {
      id: 1,
      type: 'qcm',
      question: 'Quel est le type de données primitif en JavaScript ?',
      options: ['Object', 'String', 'Array', 'Function'],
      correctAnswer: 1,
      points: 1,
      explanation: 'String est un type de données primitif en JavaScript.'
    },
    {
      id: 2,
      type: 'true-false',
      question: 'JavaScript est un langage typé statiquement.',
      correctAnswer: 'false',
      points: 1,
      explanation: 'JavaScript est un langage typé dynamiquement.'
    },
    {
      id: 3,
      type: 'short-answer',
      question: 'Quelle méthode permet d\'ajouter un élément à la fin d\'un tableau ?',
      correctAnswer: 'push',
      points: 2,
      explanation: 'La méthode push() ajoute un ou plusieurs éléments à la fin d\'un tableau.'
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.quizId = +this.route.snapshot.paramMap.get('quizId')!;
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
      } else if (this.editingQuestion.type === 'true-false') {
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
      } else if (this.newQuestion.type === 'true-false') {
        this.newQuestion.options = undefined;
        this.newQuestion.correctAnswer = 'true';
      } else {
        this.newQuestion.options = undefined;
        this.newQuestion.correctAnswer = '';
      }
    }
  }

  createQuestion() {
    if (this.newQuestion.question) {
      const question: Question = {
        id: Math.max(...this.questions.map(q => q.id)) + 1,
        type: this.newQuestion.type!,
        question: this.newQuestion.question,
        options: this.newQuestion.options,
        correctAnswer: this.newQuestion.correctAnswer!,
        points: this.newQuestion.points || 1,
        explanation: this.newQuestion.explanation
      };
      this.questions.push(question);
      this.closeModal();
    }
  }

  editQuestion(question: Question) {
    this.editingQuestion = { ...question };
    if (this.editingQuestion.options) {
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

  deleteQuestion(questionId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.questions = this.questions.filter(q => q.id !== questionId);
    }
  }

  duplicateQuestion(question: Question) {
    const duplicated: Question = {
      ...question,
      id: Math.max(...this.questions.map(q => q.id)) + 1,
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
      case 'true-false': return 'Vrai/Faux';
      case 'short-answer': return 'Réponse courte';
      default: return type;
    }
  }

  addOption() {
    if (this.editingQuestion?.options) {
      this.editingQuestion.options.push('');
    } else if (this.newQuestion.options) {
      this.newQuestion.options.push('');
    }
  }

  removeOption(index: number) {
    if (this.editingQuestion?.options) {
      this.editingQuestion.options.splice(index, 1);
    } else if (this.newQuestion.options) {
      this.newQuestion.options.splice(index, 1);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}