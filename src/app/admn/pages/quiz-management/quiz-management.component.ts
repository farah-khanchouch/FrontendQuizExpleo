import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../../models/quiz.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CBUS } from '../../../constants/cbus';

@Component({
  selector: 'app-quiz-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quiz-management.component.html',
  styleUrls: ['./quiz-management.component.css', '../../global_styles.css']
})
export class QuizManagementComponent implements OnInit, OnDestroy {
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  showCreateModal = false;
  editingQuiz: Quiz | null = null;
  isLoading = false;
  error: string | null = null;
  quizImageFile: File | null = null;
  quizImageUrl: string | null = null;

  // Propriétés manquantes ajoutées
  activeMenuId: string | null = null;
  toasts: any[] = [];

  private subscriptions: Subscription[] = [];

  newQuiz = {
    title: '',              // Le titre du quiz (modifiable par l'admin)
    description: '',        // La description (modifiable)
    theme: '',              // Thème saisi librement par l’admin (ex: "technique", "culture générale"...)
    duration: 0,           // Durée en minutes (modifiable)
    points: 0,            // Nombre total de points (modifiable)
    imageUrl: '',           // URL d’une image (peut être définie)
    badge: '',              // Nom du badge à attribuer
    badgeClass: '',
    cbus: [] as string[],       // Classe CSS ou identifiant du badge
    status: 'draft' as 'active' | 'draft' | 'archived' // Statut du quiz (menu déroulant ou bouton radio dans le formulaire)
  };

  cbusList = CBUS;
  selectedCBUs: string[] = [];
  allCBUsSelected = false;

  toggleAllCBUs() {
    if (this.allCBUsSelected) {
      this.selectedCBUs = [...this.cbusList];
    } else {
      this.selectedCBUs = [];
    }
  }

  constructor(private quizService: QuizService, private router: Router) { }

  ngOnInit() {
    this.loadQuizzes(true);
    // S'abonner aux changements en temps réel
    const quizzesSubscription = this.quizService.quizzes$.subscribe(
      quizzes => {
        this.quizzes = quizzes;
        this.filteredQuizzes = [...this.quizzes]; // Initialiser les quiz filtrés
        this.updateQuestionCounts();
      }
    );
    this.subscriptions.push(quizzesSubscription);
  }

  onCBUCheckboxChange(event: any, cbu: string) {
    if (event.target.checked) {
      if (!this.selectedCBUs.includes(cbu)) {
        this.selectedCBUs.push(cbu);
      }
    } else {
      this.selectedCBUs = this.selectedCBUs.filter(selected => selected !== cbu);
    }
    this.allCBUsSelected = this.selectedCBUs.length === this.cbusList.length;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Méthodes manquantes ajoutées selon les erreurs
  getActiveQuizzesCount(): number {
    return this.quizzes.filter(quiz => quiz.status === 'active').length;
  }

  filterByStatus(event: any) {
    const status = event.target.value;
    if (status === 'all') {
      this.filteredQuizzes = [...this.quizzes];
    } else {
      this.filteredQuizzes = this.quizzes.filter(quiz => quiz.status === status);
    }
  }

  onQuizImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.error = "Seuls les fichiers JPG, JPEG ou PNG sont autorisés.";
        this.quizImageFile = null;
        this.quizImageUrl = null;
        return;
      }

      this.quizImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.quizImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  filterByTheme(event: any) {
    const theme = event.target.value;
    if (theme === 'all') {
      this.filteredQuizzes = [...this.quizzes];
    } else {
      this.filteredQuizzes = this.quizzes.filter(quiz => quiz.theme === theme);
    }
  }

  trackQuizById(index: number, quiz: Quiz): any {
    return quiz.id || quiz._id || index;
  }

  toggleQuizMenu(quizId: string) {
    this.activeMenuId = this.activeMenuId === quizId ? null : quizId;
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  removeToast(toastId: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== toastId);
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const toast = {
      id: Date.now().toString(),
      message,
      type
    };
    this.toasts.push(toast);

    // Auto-remove après 5 secondes
    setTimeout(() => {
      this.removeToast(toast.id);
    }, 5000);
  }

  // Fermer les menus quand on clique ailleurs
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu') && !target.closest('.menu-button')) {
      this.activeMenuId = null;
    }
  }

  loadQuizzes(forceRefresh: boolean = false) {
    this.isLoading = true;
    this.error = null;

    const loadSubscription = this.quizService.getQuizzes(forceRefresh).subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.filteredQuizzes = [...this.quizzes]; // Initialiser les quiz filtrés
        this.updateQuestionCounts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des quiz:', err);
        this.error = 'Impossible de charger les quiz. Veuillez réessayer.';
        this.showToast('Erreur lors du chargement des quiz', 'error');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(loadSubscription);
  }

  // Mettre à jour dynamiquement le nombre de questions pour chaque quiz
  updateQuestionCounts() {
    this.quizzes.forEach(quiz => {
      if (quiz.id) {
        this.getQuestionCount(quiz.id).then(count => {
          quiz.questions = count as any; // Pour l'affichage
        });
      }
    });
  }

  // Récupérer le nombre de questions de manière asynchrone
  async getQuestionCount(quizId: string): Promise<number> {
    try {
      const questions = await this.quizService.getQuestionsByQuiz(quizId).toPromise();
      return questions?.length || 0;
    } catch (error) {
      console.error(`Erreur lors du comptage des questions pour le quiz ${quizId}:`, error);
      return 0;
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.editingQuiz = null;
    this.resetNewQuiz();
  }

  closeModal() {
    this.showCreateModal = false;
    this.editingQuiz = null;
    this.resetNewQuiz();
  }

  resetNewQuiz() {
    this.newQuiz = {
      title: '',
      description: '',
      theme: '',
      duration: 5,
      points: 10,
      imageUrl: '',
      badge: '',
      badgeClass: '',
      cbus: [] as string[],
      status: 'draft'
    };
  }

  createQuiz() {
    if (this.newQuiz.title && this.newQuiz.description) {
      this.isLoading = true;
      this.newQuiz.cbus = this.selectedCBUs;

      const createSubscription = this.quizService.createQuiz(this.newQuiz as Quiz).subscribe({
        next: (response) => {
          console.log('Quiz créé avec succès:', response);

          const quizId = response.id || response._id;
          if (quizId) {
            this.closeModal();
            this.showToast('Quiz créé avec succès', 'success');
            // Rediriger vers la gestion des questions
            this.router.navigate(['/admin/question-management', quizId]);
          } else {
            console.error('ID du quiz non trouvé:', response);
            this.error = 'Quiz créé mais impossible de récupérer son ID';
            this.showToast('Erreur lors de la création', 'error');
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.error = 'Erreur lors de la création du quiz. Veuillez réessayer.';
          this.showToast('Erreur lors de la création du quiz', 'error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(createSubscription);
    } else {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
    }
  }

  editQuiz(quiz: Quiz) {
    this.editingQuiz = { ...quiz };
    this.selectedCBUs = quiz.cbus ? [...quiz.cbus] : [];
    this.showCreateModal = true;
    this.activeMenuId = null; // Fermer le menu dropdown
  }

  updateQuiz() {
    if (this.editingQuiz && this.editingQuiz.id) {
      this.isLoading = true;
      this.editingQuiz.cbus = this.selectedCBUs;
      const updateSubscription = this.quizService.updateQuiz(this.editingQuiz.id, this.editingQuiz).subscribe({
        next: (updatedQuiz) => {
          console.log('Quiz mis à jour:', updatedQuiz);

          // Mettre à jour la liste locale
          const index = this.quizzes.findIndex(q => q.id === updatedQuiz.id);
          if (index !== -1) {
            this.quizzes[index] = { ...this.quizzes[index], ...updatedQuiz };
            // Maintenir le nombre de questions
            this.getQuestionCount(updatedQuiz.id).then(count => {
              this.quizzes[index].questions = count as any;
            });
          }

          this.closeModal();
          this.showToast('Quiz mis à jour avec succès', 'success');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.error = 'Erreur lors de la mise à jour du quiz.';
          this.showToast('Erreur lors de la mise à jour du quiz', 'error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(updateSubscription);
    }
  }

  deleteQuiz(quiz: Quiz) {
    const quizId = quiz.id || quiz._id;
    if (confirm(`Êtes-vous sûr de vouloir supprimer le quiz "${quiz.title}" ?`)) {
      this.isLoading = true;

      const deleteSubscription = this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          console.log('Quiz supprimé avec succès');
          this.showToast('Quiz supprimé avec succès', 'success');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.error = 'Erreur lors de la suppression du quiz.';
          this.showToast('Erreur lors de la suppression du quiz', 'error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(deleteSubscription);
    }
    this.activeMenuId = null; // Fermer le menu dropdown
  }

  duplicateQuiz(quiz: Quiz) {
    if (confirm(`Voulez-vous dupliquer le quiz "${quiz.title}" ?`)) {
      this.isLoading = true;

      const duplicateSubscription = this.quizService.duplicateQuiz(quiz).subscribe({
        next: (newQuiz) => {
          console.log('Quiz dupliqué avec succès:', newQuiz);
          this.showToast('Quiz dupliqué avec succès', 'success');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la duplication:', err);
          this.error = 'Erreur lors de la duplication du quiz.';
          this.showToast('Erreur lors de la duplication du quiz', 'error');
          this.isLoading = false;
        }
      });
      this.subscriptions.push(duplicateSubscription);
    }
    this.activeMenuId = null; // Fermer le menu dropdown
  }

  // Naviguer vers la gestion des questions
  manageQuestions(quiz: Quiz) {
    const quizId = quiz.id || quiz._id;
    this.router.navigate(['/admin/question-management', quizId]);
    this.activeMenuId = null; // Fermer le menu dropdown
  }

  // Prévisualiser le quiz
  previewQuiz(quiz: Quiz) {
    const quizId = quiz.id || quiz._id;
    this.router.navigate(['/quiz', quizId]);
    this.activeMenuId = null; // Fermer le menu dropdown
  }

  // Publier/dépublier un quiz
  toggleQuizStatus(quiz: Quiz) {
    const newStatus = quiz.status === 'active' ? 'draft' : 'active';
    const quizId = quiz.id || quiz._id;
    const typedStatus = newStatus as 'draft' | 'active' | 'archived';
    const updatedQuizFixed = { ...quiz, status: typedStatus };

    const toggleSubscription = this.quizService.updateQuiz(quizId, updatedQuizFixed).subscribe({
      next: (updated) => {
        console.log('Statut du quiz mis à jour:', updated);
        // Mise à jour locale
        const index = this.quizzes.findIndex(q => (q.id || q._id) === quizId);
        if (index !== -1) {
          this.quizzes[index].status = updated.status;
        }
        this.showToast(`Quiz ${typedStatus === 'active' ? 'activé' : 'désactivé'} avec succès`, 'success');
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut:', err);
        this.error = 'Erreur lors de la mise à jour du statut.';
        this.showToast('Erreur lors de la mise à jour du statut', 'error');
      }
    });
    this.subscriptions.push(toggleSubscription);
    this.activeMenuId = null; // Fermer le menu dropdown
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

  getThemeLabel(theme: string): string {
    switch (theme) {
      case 'technique': return 'Technique';
      case 'culture': return 'Culture générale';
      case 'ludique': return 'Ludique';
      default: return theme;
    }
  }

  getThemeClass(theme: string): string {
    switch (theme) {
      case 'technique': return 'theme-technique';
      case 'culture': return 'theme-culture';
      case 'ludique': return 'theme-ludique';
      default: return 'theme-default';
    }
  }

  // Filtrer les quizzes
  filterQuizzes(status?: string, theme?: string) {
    this.loadQuizzes(); // Recharger depuis le serveur avec filtres si nécessaire
  }

  // // Rechercher dans les quizzes
  // searchQuizzes(searchTerm: string) {
  //   if (!searchTerm.trim()) {
  //     this.filteredQuizzes = [...this.quizzes];
  //     return;
  //   }

  //   this.filteredQuizzes = this.quizzes.filter(quiz => 
  //     quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }

  // Obtenir les statistiques du quiz
  getQuizStats(quiz: Quiz) {
    return {
      questions: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questions as any || 0),
      participants: quiz.participants || 0,
      averageScore: quiz.averageScore || 0,
      duration: quiz.duration || 0,
      points: quiz.points || 0
    };
  }

  // Calculer la progression du quiz (si l'admin veut voir le taux de complétion)
  getCompletionRate(quiz: Quiz): number {
    if (!quiz.participants || quiz.participants === 0) return 0;
    // Logique pour calculer le taux de complétion basé sur vos données
    return Math.round((quiz.participants / 100) * 100); // Exemple
  }

  clearError() {
    this.error = null;
  }
}