import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../services/quiz.service';
import { Router } from '@angular/router';
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
  ) { }
  private baseUrl = 'http://localhost:3000/api/quizzes';

  ngOnInit() {
    // Récupérer quizId une seule fois au chargement
    this.route.params.subscribe(params => {
      this.quizId = params['id'] || params['quizId'];

      if (!this.quizId) {
        console.error('QuizId is null or undefined!');
        alert('Erreur: ID du quiz non trouvé dans l\'URL');
        return;
      }

      this.loadQuestionsFromServer();
      this.loadQuizTitle();
    });
  }

  loadQuestionsFromServer() {
    this.quizService.getQuestionsByQuiz(this.quizId).subscribe({
      next: (questions) => {
        this.questions = questions; // Réinitialiser les questions
      },
      error: (err) => {
        console.error('Erreur chargement questions:', err);
      }
    });
  }

  loadQuizTitle() {
    this.quizService.getQuizById(this.quizId).subscribe({
      next: (quiz) => {
        this.quizTitle = quiz.title;
      },
      error: (err) => {
        console.error('Erreur chargement quiz:', err);
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;

    // Réinitialiser les données du formulaire
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
    const target = this.editingQuestion ?? this.newQuestion;

    if (target?.type === 'qcm') {
      target.options = ['', '', '', ''];
      target.correctAnswer = 0;
    } else if (target?.type === 'vrai-faux') {
      target.options = undefined;
      target.correctAnswer = 'true';
    } else {
      target.options = undefined;
      target.correctAnswer = '';
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
      this.quizService.deleteQuestion(questionId).subscribe({
        next: () => {
          this.loadQuestionsFromServer();
          alert('Question supprimée avec succès');
        },
        error: () => {
          alert('Erreur lors de la suppression de la question');
        }
      });
    }
  }

  duplicateQuestion(question: Question) {
    const duplicated: Question = {
      ...question,
      id: undefined, // très important : retirer l'ID
      question: `${question.question} (Copie)`
    };
    if (duplicated.options) {
      duplicated.options = [...duplicated.options];
    }

    // Appel API direct pour créer une copie dans la base :
    const questionData: NewQuestion = {
      type: duplicated.type,
      question: duplicated.question,
      options: duplicated.options,
      correctAnswer: duplicated.correctAnswer,
      points: duplicated.points,
      explanation: duplicated.explanation,
      quizId: this.quizId
    };

    this.createQuestion(this.quizId, questionData).subscribe({
      next: () => {
        this.loadQuestionsFromServer(); // recharge la liste propre
      },
      error: (err) => {
        console.error('Erreur lors de la duplication :', err);
        alert('Erreur lors de la duplication de la question.');
      }
    });
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

  // 1. Modifiez votre méthode saveAllQuestions()
  saveAllQuestions() {
    console.log('🚀 Début de la sauvegarde des questions...');
    console.log('Questions à traiter:', this.questions);
    console.log('Quiz ID:', this.quizId);

    if (!this.questions || this.questions.length === 0) {
      console.log('⚠️ Aucune question à sauvegarder');
      alert('Aucune question à sauvegarder. Veuillez ajouter des questions d\'abord.');
      return;
    }

    // Séparer les questions à créer et à mettre à jour
    const questionsToCreate = this.questions.filter(q => !q.id);
    const questionsToUpdate = this.questions.filter(q => q.id);

    console.log('Questions à créer:', questionsToCreate.length);
    console.log('Questions à mettre à jour:', questionsToUpdate.length);

    // Traiter les créations d'abord
    this.processCreations(questionsToCreate).then(() => {
      // Puis traiter les mises à jour
      return this.processUpdates(questionsToUpdate);
    }).then(() => {
      console.log('✅ Toutes les questions ont été sauvegardées avec succès');
      alert('Questions sauvegardées avec succès !');
      this.router.navigate(['/admin/quiz-management']);
    }).catch((error) => {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      this.handleSaveError(error);
    });
  }

  // 2. Traiter les créations séquentiellement
  private async processCreations(questionsToCreate: any[]): Promise<void> {
    for (let i = 0; i < questionsToCreate.length; i++) {
      const question = questionsToCreate[i];
      console.log(`Création de la question ${i + 1}/${questionsToCreate.length}`);

      try {
        const questionData = {
          question: question.question,
          type: question.type,
          options: question.options ?? [],
          correctAnswer: question.correctAnswer,
          points: question.points,
          explanation: question.explanation ?? '',
          quizId: this.quizId
        };

        const response = await this.quizService.createQuestion(
          this.quizId.toString(),
          questionData
        ).toPromise();

        console.log('Question créée avec succès:', response);

        // Mettre à jour l'ID de la question dans la liste locale
        const questionIndex = this.questions.findIndex(q =>
          q === question // Comparaison par référence
        );

        if (questionIndex !== -1 && response && response.id) {
          this.questions[questionIndex].id = response.id;
          console.log(`ID assigné à la question ${questionIndex}:`, this.questions[questionIndex].id);
        }

      } catch (error) {
        console.error(`Erreur lors de la création de la question ${i + 1}:`, error);
        throw error;
      }
    }
  }

  // 3. Traiter les mises à jour séquentiellement
  private async processUpdates(questionsToUpdate: any[]): Promise<void> {
    for (let i = 0; i < questionsToUpdate.length; i++) {
      const question = questionsToUpdate[i];
      console.log(`Mise à jour de la question ${i + 1}/${questionsToUpdate.length} (ID: ${question.id})`);

      try {
        const questionData = {
          question: question.question,
          type: question.type,
          options: question.options ?? [],
          correctAnswer: question.correctAnswer,
          points: question.points,
          explanation: question.explanation ?? '',
          quizId: this.quizId
        };

        // Vérifier que l'ID existe avant la mise à jour
        if (!question.id) {
          console.error('ID manquant pour la question:', question);
          throw new Error('ID de question manquant pour la mise à jour');
        }

        const response = await this.quizService.updateQuestion(
          question.id,
          questionData
        ).toPromise();

        console.log('Question mise à jour avec succès:', response);

      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la question ${i + 1} (ID: ${question.id}):`, error);

        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 404) {
          console.log('Question non trouvée, tentative de recréation...');
          // Retirer l'ID et recréer
          question.id = undefined;
          await this.processCreations([question]);
        } else {
          throw error;
        }
      }

    }
  }

  // 4. Gérer les erreurs de sauvegarde
  private handleSaveError(error: any): void {
    console.error('Erreur détaillée:', error);

    let errorMessage = 'Une erreur est survenue lors de la sauvegarde des questions.';

    if (error.status) {
      switch (error.status) {
        case 404:
          errorMessage = 'Ressource non trouvée. Certaines questions ont peut-être été supprimées.';
          break;
        case 400:
          errorMessage = 'Données invalides. Vérifiez le contenu de vos questions.';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message || 'Erreur inconnue'}`;
      }
    } else if (error.message) {
      errorMessage += '\nDétails: ' + error.message;
    }

    alert(errorMessage);
  }

  // // 5. Méthode pour recharger les questions depuis le serveur
  // loadQuestionsFromServer() {
  //   this.quizService.getQuestionsByQuiz(this.quizId).subscribe({
  //     next: (questions) => {
  //       this.questions = questions; // ne pas utiliser `this.questions.push(...)`
  //     },
  //     error: (err) => {
  //       console.error('Erreur chargement questions:', err);
  //     }
  //   });
  // }


  // 6. Méthode à appeler dans ngOnInit pour charger les questions existantes


  // 7. Alternative : sauvegarde avec rechargement automatique
  saveAllQuestionsWithReload() {
    // Sauvegarder
    this.saveAllQuestions();

    // Puis recharger après un délai
    setTimeout(() => {
      this.loadQuestionsFromServer();
    }, 1000);
  }

  // Méthode utilitaire pour valider une question avant sauvegarde
  private validateQuestion(question: any): boolean {
    if (!question.question || question.question.trim() === '') {
      console.error('Question vide détectée:', question);
      return false;
    }

    if (!question.type) {
      console.error('Type de question manquant:', question);
      return false;
    }

    if (!question.correctAnswer) {
      console.error('Réponse correcte manquante:', question);
      return false;
    }

    if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
      console.error('Options insuffisantes pour question à choix multiple:', question);
      return false;
    }

    return true;
  }

  // Version alternative avec validation
  saveAllQuestionsWithValidation() {
    // Ajoutez ceci au début de saveAllQuestions()
    console.log('Questions actuelles:', this.questions);
    console.log('Quiz ID:', this.quizId);
    console.log('🚀 Début de la sauvegarde avec validation...');

    // Valider toutes les questions
    const invalidQuestions = this.questions.filter(q => !this.validateQuestion(q));

    if (invalidQuestions.length > 0) {
      console.error('Questions invalides détectées:', invalidQuestions);
      alert(`${invalidQuestions.length} question(s) sont incomplètes. Veuillez vérifier que tous les champs sont remplis.`);
      return;
    }

    // Si toutes les questions sont valides, procéder à la sauvegarde
    this.saveAllQuestions();
  }

  loadQuestions() {
    if (this.quizId) {
      this.quizService.getQuestionsByQuizId(this.quizId.toString()).subscribe({
        next: (questions) => {
          this.questions = questions || [];
          console.log('Questions chargées:', this.questions);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des questions:', error);
          this.questions = [];
        }
      });
    }
  }

  saveNewQuestion() {
    // Validation des champs obligatoires
    if (!this.newQuestion.question || !this.newQuestion.type) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!this.quizId) {
      alert('Erreur: ID du quiz manquant. Impossible de créer la question.');
      return;
    }

    // Créer l'objet questionData avec toutes les données nécessaires
    const questionData: NewQuestion = {
      ...this.newQuestion as NewQuestion,
      quizId: this.quizId
    };

    // Utiliser le service QuizService au lieu de la méthode locale
    this.quizService.createQuestion(this.quizId.toString(), questionData).subscribe({
      next: (createdQuestion) => {
        console.log('Question créée avec succès:', createdQuestion);
        this.closeModal();
        this.loadQuestionsFromServer(); // ✅ recharger depuis backend
      },
      error: (error) => {
        console.error('Erreur lors de la création de la question:', error);
        alert('Une erreur est survenue lors de la création de la question.');
      }
    });
  }
}