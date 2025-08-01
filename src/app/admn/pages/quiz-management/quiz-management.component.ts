import { Component, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../../models/quiz.model';
import { Router } from '@angular/router'; // Ajoutez cet import



@Component({
  selector: 'app-quiz-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quiz-management.component.html',
  styleUrls: ['./quiz-management.component.css', '../../global_styles.css']
})

export class QuizManagementComponent implements OnInit  {
  constructor(private quizService: QuizService, private router: Router) {}

  showCreateModal = false;
  editingQuiz: Quiz | null = null;
  
  newQuiz = {
    title: '',
    description: '',
    status: 'draft' as 'active' | 'draft' | 'archived'
  };

  quizzes: Quiz[] = [];


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
    console.log('Données à envoyer:', this.newQuiz); // Debug
    
    this.quizService.createQuiz(this.newQuiz).subscribe({
      next: (response) => {
        console.log('Réponse complète du backend:', response); // IMPORTANT: voir la structure

        // Récupérer l'ID du quiz créé de façon sûre
        const quizId = (response as any)._id || (response as any).id;
        console.log('ID récupéré:', quizId); // Debug

        if (quizId) {
          this.quizzes.push(response as Quiz);
          this.closeModal();
          this.router.navigate(['/admin/question-management', quizId]);
        } else {
          console.error('Aucun ID trouvé dans la réponse:', response);
          alert('Quiz créé mais impossible de récupérer son ID');
        }
      },
      error: (err) => {
        console.error('Erreur complète:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Error body:', err.error);
        alert('Erreur lors de la création du quiz. Veuillez réessayer.');
      }
    });
  }
}


  editQuiz(quiz: Quiz) {
    this.editingQuiz = { ...quiz };
    this.showCreateModal = true;
  }

  updateQuiz() {
    if (this.editingQuiz) {
      this.quizService.updateQuiz(this.editingQuiz.id.toString(), this.editingQuiz).subscribe({
        next: (updatedQuiz) => {
          // Ensure both ids are compared as numbers
          const index = this.quizzes.findIndex(q => q.id === updatedQuiz.id);
          if (index !== -1) {
            // Only update allowed fields, keep questions as id (number) if that's the Quiz type
            this.quizzes[index] = {
              ...this.quizzes[index],
              ...updatedQuiz,
              id: updatedQuiz.id,
              questions: this.quizzes[index].questions // preserve questions as number (id)
            };
          }
        },
        error: (err) => {
          this.closeModal();
          console.error('Erreur lors de la mise à jour du quiz:', err);
          alert('Erreur lors de la mise à jour du quiz.');
        }
      });
    }
  }
  
  ngOnInit() {
    this.loadQuizzes();
  }
  
  loadQuizzes() {
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des quiz:', err);
        alert('Erreur lors du chargement des quiz.');
      }
    });
  }
  
  deleteQuiz(quizId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.quizzes = this.quizzes.filter(q => q.id !== quizId);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du quiz:', err);
          alert('Erreur lors de la suppression du quiz.');
        }
      });
    }
  }
  
  
  
  duplicateQuiz(quiz: Quiz) {
    // On enlève l'id avant d’envoyer la copie
    const { id, ...quizSansId } = quiz;
  
    const duplicated: Partial<Quiz> = {
      ...quizSansId,
      title: `${quiz.title} (Copie)`,
      status: 'draft',
      createdAt: new Date(),
      participants: 0,
      averageScore: 0
    };
  
    this.quizService.createQuiz(duplicated).subscribe({
      next: (newQuiz) => {
        this.quizzes.push(newQuiz); // On ajoute la nouvelle copie à la liste
      },
      error: (err) => {
        console.error('Erreur lors de la duplication :', err);
        alert('Échec de la duplication du quiz.');
      }
    });
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