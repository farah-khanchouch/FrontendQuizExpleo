import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  participants: number;
  averageScore: number;
}

@Component({
  selector: 'app-quiz-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quiz-management.component.html',
  styleUrls: ['./quiz-management.component.css', '../../global_styles.css']
})
export class QuizManagementComponent {
  showCreateModal = false;
  editingQuiz: Quiz | null = null;
  
  newQuiz = {
    title: '',
    description: '',
    status: 'draft' as 'active' | 'draft' | 'archived'
  };

  quizzes: Quiz[] = [
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      description: 'Test des connaissances de base en JavaScript',
      questions: 15,
      status: 'active',
      createdAt: new Date('2024-01-15'),
      participants: 42,
      averageScore: 78
    },
    {
      id: 2,
      title: 'Angular Basics',
      description: 'Introduction au framework Angular',
      questions: 12,
      status: 'active',
      createdAt: new Date('2024-01-20'),
      participants: 35,
      averageScore: 85
    },
    {
      id: 3,
      title: 'CSS Grid & Flexbox',
      description: 'Maîtrise des layouts CSS modernes',
      questions: 10,
      status: 'draft',
      createdAt: new Date('2024-01-25'),
      participants: 0,
      averageScore: 0
    }
  ];

  openCreateModal() {
    this.showCreateModal = true;
    this.newQuiz = { title: '', description: '', status: 'draft' };
  }

  closeModal() {
    this.showCreateModal = false;
    this.editingQuiz = null;
  }

  createQuiz() {
    if (this.newQuiz.title && this.newQuiz.description) {
      const quiz: Quiz = {
        id: Math.max(...this.quizzes.map(q => q.id)) + 1,
        title: this.newQuiz.title,
        description: this.newQuiz.description,
        questions: 0,
        status: this.newQuiz.status,
        createdAt: new Date(),
        participants: 0,
        averageScore: 0
      };
      this.quizzes.push(quiz);
      this.closeModal();
    }
  }

  editQuiz(quiz: Quiz) {
    this.editingQuiz = { ...quiz };
    this.showCreateModal = true;
  }

  updateQuiz() {
    if (this.editingQuiz) {
      const index = this.quizzes.findIndex(q => q.id === this.editingQuiz!.id);
      if (index !== -1) {
        this.quizzes[index] = { ...this.editingQuiz };
      }
      this.closeModal();
    }
  }

  deleteQuiz(quizId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      this.quizzes = this.quizzes.filter(q => q.id !== quizId);
    }
  }

  duplicateQuiz(quiz: Quiz) {
    const duplicated: Quiz = {
      ...quiz,
      id: Math.max(...this.quizzes.map(q => q.id)) + 1,
      title: `${quiz.title} (Copie)`,
      status: 'draft',
      createdAt: new Date(),
      participants: 0,
      averageScore: 0
    };
    this.quizzes.push(duplicated);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return status;
    }
  }
}