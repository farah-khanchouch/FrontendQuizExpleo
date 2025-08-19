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
  correctAnswer: number | number[] | string | boolean;  points: number;
  explanation?: string;
  quizId?: string;
}

export interface NewQuestion {
  type: 'qcm' | 'vrai-faux' | 'libre';
  question: string;
  options?: string[];
  correctAnswer: number | number[] | string | boolean; // <-- Nouveau type
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
        this.questions = questions || [];
        console.log('Questions chargées depuis le serveur:', this.questions);
      },
      error: (err) => {
        console.error('Erreur chargement questions:', err);
        this.questions = [];
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
    if (!this.editingQuestion || !this.editingQuestion.id) {
      alert('Erreur: Impossible de mettre à jour la question');
      return;
    }

    // Valider la question
    if (!this.validateQuestion(this.editingQuestion)) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Mettre à jour dans la liste locale
    const index = this.questions.findIndex(q => q.id === this.editingQuestion!.id);
    if (index !== -1) {
      this.questions[index] = { ...this.editingQuestion };
      this.marquerQuestionModifiee(this.questions[index]);
    }

    this.closeModal();
    alert('Question modifiée localement. Cliquez sur "Synchroniser" pour sauvegarder.');
  }

  deleteQuestion(questionId?: string) {
    if (!questionId) {
      console.warn('deleteQuestion called with undefined questionId');
      return;
    }
    
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      this.supprimerQuestion(question);
    }
  }

  duplicateQuestion(question: Question) {
    const questionData: NewQuestion = {
      type: question.type,
      question: `${question.question} `,
      options: question.options ? [...question.options] : undefined,
      correctAnswer: question.correctAnswer,
      points: question.points,
      explanation: question.explanation,
      quizId: this.quizId
    };

    this.quizService.createQuestion(this.quizId.toString(), questionData).subscribe({
      next: (createdQuestion) => {
        console.log('Question dupliquée avec succès:', createdQuestion);
        this.loadQuestionsFromServer(); // Recharger pour voir la nouvelle question
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

  saveNewQuestion() {
    if (!this.validateQuestion(this.newQuestion)) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
  // PATCH : conversion automatique pour vrai-faux
  if (this.newQuestion.type === 'vrai-faux') {
    if (this.newQuestion.correctAnswer === 'Vrai' || this.newQuestion.correctAnswer === true) {
      this.newQuestion.correctAnswer = true;
    } else if (this.newQuestion.correctAnswer === 'Faux' || this.newQuestion.correctAnswer === false) {
      this.newQuestion.correctAnswer = false;
    }
  }
    if (!this.quizId) {
      alert('Erreur: ID du quiz manquant. Impossible de créer la question.');
      return;
    }

    // Créer la question localement
    const nouvelleQuestion: Question = {
      type: this.newQuestion.type!,
      question: this.newQuestion.question!,
      options: this.newQuestion.options ? [...this.newQuestion.options] : undefined,
      correctAnswer: this.newQuestion.correctAnswer!,
      points: this.newQuestion.points!,
      explanation: this.newQuestion.explanation || '',
      quizId: this.quizId
      // Pas d'ID - sera assigné lors de la synchronisation
    };

    this.questionsACreer.push(nouvelleQuestion);
    this.modificationsPendantes = true;

    this.closeModal();
    alert('Nouvelle question ajoutée localement. Cliquez sur "Synchroniser" pour sauvegarder.');
  }

  // Méthode de validation améliorée
  private validateQuestion(question: any): boolean {
    if (!question) {
      console.error('Question undefined');
      return false;
    }

    if (!question.question || question.question.trim() === '') {
      console.error('Question vide détectée:', question);
      return false;
    }

    if (!question.type) {
      console.error('Type de question manquant:', question);
      return false;
    }

    if (question.correctAnswer === null || question.correctAnswer === undefined || question.correctAnswer === '') {
      console.error('Réponse correcte manquante:', question);
      return false;
    }

    if (question.type === 'qcm' && (!question.options || question.options.length < 2)) {
      console.error('Options insuffisantes pour question QCM:', question);
      return false;
    }

    if (!question.points || question.points <= 0) {
      console.error('Points invalides:', question);
      return false;
    }

    return true;
  }

  // Variables pour suivre les modifications
  private questionsModifiees: Set<string> = new Set(); // IDs des questions modifiées
  private questionsACreer: Question[] = []; // Questions sans ID à créer
  private questionsASupprimer: Set<string> = new Set(); // IDs des questions à supprimer
  private modificationsPendantes = false;

  // Marquer une question comme modifiée
  private marquerQuestionModifiee(question: Question) {
    if (question.id) {
      this.questionsModifiees.add(question.id);
    }
    this.modificationsPendantes = true;
    console.log('Question marquée comme modifiée:', question.id);
  }

  // Ajouter une nouvelle question (sans ID)
  ajouterNouvelleQuestion() {
    const nouvelleQuestion: Question = {
      type: 'qcm',
      question: 'Nouvelle question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      points: 1,
      explanation: '',
      quizId: this.quizId
    };

    this.questionsACreer.push(nouvelleQuestion);
    this.modificationsPendantes = true;
    console.log('Nouvelle question ajoutée:', nouvelleQuestion);
  }

  // Supprimer une question (marquer pour suppression)
  supprimerQuestion(question: Question) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return;
    }

    // Retirer de la liste affichée
    const index = this.questions.indexOf(question);
    if (index > -1) {
      this.questions.splice(index, 1);
    }

    // Si la question a un ID, la marquer pour suppression sur le serveur
    if (question.id) {
      this.questionsASupprimer.add(question.id);
    } else {
      // Si pas d'ID, la retirer de la liste des questions à créer
      const indexCreer = this.questionsACreer.indexOf(question);
      if (indexCreer > -1) {
        this.questionsACreer.splice(indexCreer, 1);
      }
    }

    this.modificationsPendantes = true;
    console.log('Question marquée pour suppression:', question.id);
  }

  // Modifier une question existante
  modifierQuestion(question: Question, champ: string, valeur: any) {
    (question as any)[champ] = valeur;
    this.marquerQuestionModifiee(question);
  }

  // MÉTHODE PRINCIPALE DE SYNCHRONISATION AVEC GESTION D'ERREURS 404
  async synchroniserAvecQuiz() {
    console.log('🔄 Début de la synchronisation complète...');
    
    if (!this.quizId) {
      alert('Erreur: ID du quiz manquant');
      return;
    }

    if (!this.modificationsPendantes) {
      // Faire une synchronisation simple (rechargement depuis serveur)
      this.loadQuestionsFromServer();
      alert('Aucune modification à synchroniser. Données rechargées depuis le serveur.');
      return;
    }

    try {
      console.log('📊 État des modifications:', {
        àCréer: this.questionsACreer.length,
        àModifier: this.questionsModifiees.size,
        àSupprimer: this.questionsASupprimer.size
      });

      let operationsReussies = 0;
      let operationsEchouees = 0;
      const erreursDetaillees: string[] = [];

      // 1. SUPPRIMER les questions (en gérant les 404)
      console.log('🗑️ Suppression des questions...');
      for (const questionId of this.questionsASupprimer) {
        try {
          console.log(`Tentative de suppression: ${questionId}`);
          await this.quizService.deleteQuestion(questionId).toPromise();
          operationsReussies++;
          console.log(`✅ Question ${questionId} supprimée`);
        } catch (error: any) {
          console.warn(`⚠️ Erreur suppression ${questionId}:`, error);
          
          if (error.status === 404) {
            // Question déjà supprimée côté serveur, c'est OK
            console.log(`ℹ️ Question ${questionId} déjà supprimée côté serveur`);
            operationsReussies++;
          } else {
            operationsEchouees++;
            erreursDetaillees.push(`Suppression ${questionId}: ${error.message || 'Erreur inconnue'}`);
          }
        }
      }

      // 2. CRÉER les nouvelles questions
      console.log('➕ Création des nouvelles questions...');
      for (let i = 0; i < this.questionsACreer.length; i++) {
        const question = this.questionsACreer[i];
        try {
          console.log(`Création question ${i + 1}/${this.questionsACreer.length}`);
          
          if (!this.validateQuestion(question)) {
            throw new Error(`Question invalide: ${question.question || 'question vide'}`);
          }

          const questionData: NewQuestion = {
            type: question.type,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
            explanation: question.explanation || '',
            quizId: this.quizId
          };

          const questionCreee = await this.quizService.createQuestion(this.quizId, questionData).toPromise();
          
          if (questionCreee) {
            // Mettre à jour l'ID dans la liste locale
            const index = this.questions.findIndex(q => q === question);
            if (index > -1) {
              this.questions[index] = questionCreee;
            }
            operationsReussies++;
            console.log(`✅ Question créée avec ID: ${questionCreee.id}`);
          } else {
            throw new Error('Réponse vide du serveur');
          }
          
        } catch (error: any) {
          console.error(`❌ Erreur création question ${i + 1}:`, error);
          operationsEchouees++;
          erreursDetaillees.push(`Création question "${question.question}": ${error.message || 'Erreur inconnue'}`);
        }
      }

      // 3. METTRE À JOUR les questions modifiées (avec gestion 404)
      console.log('✏️ Mise à jour des questions modifiées...');
      for (const questionId of this.questionsModifiees) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) {
          console.warn(`Question ${questionId} introuvable dans la liste locale`);
          continue;
        }

        try {
          console.log(`Mise à jour question ${questionId}`);
          
          if (!this.validateQuestion(question)) {
            throw new Error(`Question invalide: ${question.question}`);
          }

          const questionData: NewQuestion = {
            type: question.type,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
            explanation: question.explanation || '',
            quizId: this.quizId
          };

          await this.quizService.updateQuestion(questionId, questionData).toPromise();
          operationsReussies++;
          console.log(`✅ Question ${questionId} mise à jour`);
          
        } catch (error: any) {
          console.warn(`⚠️ Erreur mise à jour ${questionId}:`, error);
          
          if (error.status === 404) {
            // Question supprimée côté serveur, essayer de la recréer
            console.log(`ℹ️ Question ${questionId} n'existe plus, tentative de recréation...`);
            try {
              const questionData: NewQuestion = {
                type: question.type,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                points: question.points,
                explanation: question.explanation || '',
                quizId: this.quizId
              };

              const questionRecreee = await this.quizService.createQuestion(this.quizId, questionData).toPromise();
              if (questionRecreee) {
                // Mettre à jour l'ID dans la liste locale
                question.id = questionRecreee.id;
                operationsReussies++;
                console.log(`✅ Question recréée avec nouvel ID: ${questionRecreee.id}`);
              }
            } catch (recreationError: any) {
              operationsEchouees++;
              erreursDetaillees.push(`Recréation ${questionId}: ${recreationError.message || 'Erreur inconnue'}`);
            }
          } else {
            operationsEchouees++;
            erreursDetaillees.push(`Mise à jour ${questionId}: ${error.message || 'Erreur inconnue'}`);
          }
        }
      }

      // 4. NETTOYER les marqueurs de modification
      this.questionsModifiees.clear();
      this.questionsACreer = [];
      this.questionsASupprimer.clear();
      this.modificationsPendantes = false;

      // 5. RECHARGER depuis le serveur pour vérifier la cohérence
      console.log('🔄 Rechargement des données depuis le serveur...');
      await this.loadQuestionsFromServer();

      // 6. AFFICHER le résultat
      const totalOperations = operationsReussies + operationsEchouees;
      let message = '';
      
      if (operationsEchouees === 0) {
        message = `✅ Synchronisation réussie! ${operationsReussies} opération(s) effectuée(s).`;
        console.log('🎉 Synchronisation 100% réussie!');
      } else if (operationsReussies > 0) {
        message = `⚠️ Synchronisation partielle: ${operationsReussies} réussie(s), ${operationsEchouees} échouée(s).`;
        if (erreursDetaillees.length > 0) {
          message += '\n\nErreurs:\n' + erreursDetaillees.join('\n');
        }
        console.log('⚠️ Synchronisation partielle terminée');
      } else {
        message = `❌ Synchronisation échouée: ${operationsEchouees} erreur(s).`;
        if (erreursDetaillees.length > 0) {
          message += '\n\nErreurs:\n' + erreursDetaillees.join('\n');
        }
        console.error('❌ Synchronisation complètement échouée');
      }
      
      alert(message);

    } catch (error: any) {
      console.error('💥 Erreur critique lors de la synchronisation:', error);
      
      let messageErreur = 'Erreur critique lors de la synchronisation:\n';
      
      if (error.status) {
        switch (error.status) {
          case 401:
            messageErreur += 'Non autorisé. Veuillez vous reconnecter.';
            break;
          case 403:
            messageErreur += 'Accès interdit. Vérifiez vos permissions.';
            break;
          case 500:
            messageErreur += 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          case 0:
            messageErreur += 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            break;
          default:
            messageErreur += `Erreur HTTP ${error.status}: ${error.message || 'Erreur inconnue'}`;
        }
      } else {
        messageErreur += error.message || 'Erreur inconnue';
      }
      
      alert(messageErreur);
    }
  }

  // Vérifier s'il y a des modifications pendantes
  aDesModificationsPendantes(): boolean {
    return this.modificationsPendantes;
  }

  // Méthode de diagnostic pour identifier les problèmes
  async diagnostiquerProblemes() {
    console.log('🔍 Diagnostic des problèmes...');
    
    if (!this.quizId) {
      console.error('❌ Quiz ID manquant');
      return;
    }

    try {
      // 1. Vérifier si le quiz existe
      console.log('Vérification du quiz...');
      const quiz = await this.quizService.getQuizById(this.quizId).toPromise();
      
      if (!quiz) {
        throw new Error('Quiz non trouvé');
      }
      
      console.log('✅ Quiz trouvé:', quiz.title);

      // 2. Vérifier les questions côté serveur
      console.log('Vérification des questions côté serveur...');
      const questionsServeur = await this.quizService.getQuestionsByQuiz(this.quizId).toPromise();
      
      if (!questionsServeur) {
        throw new Error('Questions serveur non trouvées');
      }
      
      console.log(`✅ ${questionsServeur.length} questions trouvées côté serveur`);

      // 3. Comparer avec les questions locales
      console.log('Comparaison local vs serveur:');
      console.log(`- Local: ${this.questions.length} questions`);
      console.log(`- Serveur: ${questionsServeur.length} questions`);

      // 4. Vérifier les IDs des questions locales
      const questionsAvecId = this.questions.filter(q => q.id);
      const questionsSansId = this.questions.filter(q => !q.id);
      
      console.log(`- Questions locales avec ID: ${questionsAvecId.length}`);
      console.log(`- Questions locales sans ID: ${questionsSansId.length}`);

      // 5. Vérifier si les IDs locaux existent côté serveur
      const idsServeur = new Set(questionsServeur.map(q => q.id));
      const idsLocauxInexistants = questionsAvecId.filter(q => q.id && !idsServeur.has(q.id)).map(q => q.id);
      
      if (idsLocauxInexistants.length > 0) {
        console.warn('⚠️ IDs locaux inexistants côté serveur:', idsLocauxInexistants);
      }

      // 6. Rapport de diagnostic
      let rapport = `📊 DIAGNOSTIC:\n`;
      rapport += `Quiz ID: ${this.quizId}\n`;
      rapport += `Quiz titre: ${quiz.title}\n\n`;
      rapport += `Questions locales: ${this.questions.length}\n`;
      rapport += `Questions serveur: ${questionsServeur.length}\n`;
      rapport += `Questions avec ID: ${questionsAvecId.length}\n`;
      rapport += `Questions sans ID: ${questionsSansId.length}\n`;
      
      if (idsLocauxInexistants.length > 0) {
        rapport += `\n⚠️ PROBLÈME: ${idsLocauxInexistants.length} question(s) locale(s) avec des IDs inexistants côté serveur\n`;
        rapport += `IDs problématiques: ${idsLocauxInexistants.join(', ')}\n`;
        rapport += `\nSOLUTION: Ces questions seront recréées lors de la synchronisation.`;
      }

      console.log(rapport);
      alert(rapport);

    } catch (error: any) {
      console.error('❌ Erreur diagnostic:', error);
      alert(`Erreur diagnostic: ${error.message || 'Erreur inconnue'}`);
    }
  }

  // Méthode pour forcer une synchronisation complète (reset)
  async forcerSynchronisationComplete() {
    if (!confirm('ATTENTION: Ceci va recharger toutes les questions depuis le serveur et perdre vos modifications non sauvegardées. Continuer ?')) {
      return;
    }

    try {
      console.log('🔄 Rechargement complet depuis le serveur...');
      
      // Reset complet
      this.questionsModifiees.clear();
      this.questionsACreer = [];
      this.questionsASupprimer.clear();
      this.modificationsPendantes = false;
      
      // Recharger depuis le serveur
      await this.loadQuestionsFromServer();
      
      alert('✅ Synchronisation complète terminée. Toutes les données ont été rechargées depuis le serveur.');
      
    } catch (error: any) {
      console.error('❌ Erreur synchronisation complète:', error);
      alert(`Erreur: ${error.message || 'Erreur inconnue'}`);
    }
  }

  // Annuler toutes les modifications (recharger depuis le serveur)
  annulerModifications() {
    if (!confirm('Êtes-vous sûr de vouloir annuler toutes les modifications non sauvegardées ?')) {
      return;
    }

    this.questionsModifiees.clear();
    this.questionsACreer = [];
    this.questionsASupprimer.clear();
    this.modificationsPendantes = false;
    
    this.loadQuestionsFromServer();
    alert('Modifications annulées. Données rechargées depuis le serveur.');
  }
}