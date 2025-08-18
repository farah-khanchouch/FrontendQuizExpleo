import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, forkJoin, timer } from 'rxjs';
import { map, catchError, tap, retry, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Quiz, Question, QuizResult, Badge } from '../../models/quiz.model';
import { of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class QuizService {
  
  private baseUrl = 'http://localhost:3000/api/quizzes';
  private questionsUrl = 'http://localhost:3000/api/questions';

  // BehaviorSubjects pour la gestion d'état en temps réel
  private quizzesSubject = new BehaviorSubject<Quiz[]>([]);
  private questionsSubject = new BehaviorSubject<{[quizId: string]: Question[]}>({});
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables publics
  public quizzes$ = this.quizzesSubject.asObservable();
  public questions$ = this.questionsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Auto-actualisation périodique (optionnel)
    this.setupPeriodicRefresh();
  }

  private setupPeriodicRefresh() {
    // Actualiser les données toutes les 30 secondes
    timer(0, 30000).pipe(
      switchMap(() => this.getQuizzes()),
      catchError(() => []) // Ignorer les erreurs de l'actualisation automatique
    ).subscribe();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private transformQuizFromAPI(quiz: any): Quiz {
    return {
      id: quiz._id || quiz.id,
      _id: quiz._id || quiz.id,
      title: quiz.title,
      description: quiz.description,
      theme: quiz.theme || 'technique',
      questions: quiz.questions || [],
      duration: quiz.duration || 30,
      points: quiz.points || 100,
      imageUrl: quiz.imageUrl,
      badge: quiz.badge,
      badgeClass: quiz.badgeClass,
      createdAt: quiz.createdAt ? new Date(quiz.createdAt) : new Date(),
      participants: quiz.participants || 0,
      averageScore: quiz.averageScore || 0,
      cbus: quiz.cbus || [],
      status: quiz.status || 'draft',
      progressStatus: quiz.progressStatus,
      userStatus: quiz.userStatus
    } as Quiz;
  }

  private transformQuestionFromAPI(question: any): Question {
    return {
      id: question._id || question.id,
      question: question.question,
      type: question.type,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: question.points || 10,
      quizId: question.quizId
    } as Question;
  }

  private updateQuizzesState(quizzes: Quiz[]): void {
    this.quizzesSubject.next(quizzes);
  }

  private addQuizToState(quiz: Quiz): void {
    const currentQuizzes = this.quizzesSubject.value;
    const existingIndex = currentQuizzes.findIndex(q => (q.id || q._id) === (quiz.id || quiz._id));
    
    if (existingIndex === -1) {
      this.quizzesSubject.next([...currentQuizzes, quiz]);
    } else {
      currentQuizzes[existingIndex] = quiz;
      this.quizzesSubject.next([...currentQuizzes]);
    }
  }
  private updateQuizInState(updatedQuiz: Quiz): void {
    const currentQuizzes = this.quizzesSubject.value;
    const index = currentQuizzes.findIndex(quiz =>
      (quiz.id || quiz._id) === (updatedQuiz.id || updatedQuiz._id)
    );
    if (index !== -1) {
      currentQuizzes[index] = { ...currentQuizzes[index], ...updatedQuiz };
      this.quizzesSubject.next([...currentQuizzes]);
    }
  }

  private removeQuizFromState(quizId: string): void {
    const currentQuizzes = this.quizzesSubject.value;
    const filteredQuizzes = currentQuizzes.filter(quiz => 
      (quiz.id || quiz._id) !== quizId
    );
    this.quizzesSubject.next(filteredQuizzes);
  }

  private updateQuestionsState(quizId: string, questions: Question[]): void {
    const currentQuestions = this.questionsSubject.value;
    currentQuestions[quizId] = questions;
    this.questionsSubject.next({...currentQuestions});
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé - Veuillez vous reconnecter';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Erreur détaillée:', error);
    this.setError(errorMessage);
    this.setLoading(false);
    return throwError(() => new Error(errorMessage));
  }

  // === MÉTHODES QUIZ ===

  getQuizzes(forceRefresh: boolean = false): Observable<Quiz[]> {
    if (!forceRefresh && this.quizzesSubject.value.length > 0) {
      return this.quizzes$;
    }
  
    this.setLoading(true);
    this.setError(null);
  
    return this.http.get<any[]>(this.baseUrl, { headers: this.getAuthHeaders() }).pipe(
      map((quizzes: any[]) =>
        quizzes.map(quiz => this.transformQuizFromAPI(quiz))
      ),
      tap(quizzes => {
        console.log('[QuizService] Quizzes loaded from API:', quizzes);
        this.updateQuizzesState(quizzes);
        this.setLoading(false);
        this.loadQuestionCountsForQuizzes(quizzes);
        console.log('[QuizService] getQuizzes() finished');
      }),
      retry(2),
      catchError(this.handleError)
    );
  }
  private loadQuestionCountsForQuizzes(quizzes: Quiz[]): void {
    quizzes.forEach(quiz => {
      const quizId = quiz.id || quiz._id;
      this.getQuestionsByQuiz(quizId, true).subscribe({
        next: (questions) => {
          const updatedQuiz = { ...quiz, questionCount: questions.length };
          this.updateQuizInState(updatedQuiz);
        },
        error: (err) => console.error(`[QuizService] Error loading questions for ${quizId}:`, err)
      });
    });
  }
  getQuizById(id: string): Observable<Quiz> {
    this.setLoading(true);
    
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(quiz => this.transformQuizFromAPI(quiz)),
      tap(quiz => {
        this.setLoading(false);
        // Mettre à jour le quiz dans l'état si il existe
        this.updateQuizInState(quiz);
      }),
      catchError(this.handleError)
    );
  }

  createQuiz(quizData: Partial<Quiz>): Observable<Quiz> {
    this.setLoading(true);
    this.setError(null);
    
    const headers = this.getAuthHeaders();
    const preparedData = {
      title: quizData.title?.trim(),
      description: quizData.description?.trim(),
      theme: quizData.theme || 'technique',
      duration: quizData.duration || 30,
      points: quizData.points || 100,
      imageUrl: quizData.imageUrl?.trim(),
      badge: quizData.badge?.trim(),
      badgeClass: quizData.badgeClass?.trim(),
      status: quizData.status || 'draft',
      questions: [],
      participants: 0,
      cbus: quizData.cbus || [],
      averageScore: 0,
      createdAt: new Date()
    };

    return this.http.post<any>(this.baseUrl, preparedData, { headers }).pipe(
      map(response => this.transformQuizFromAPI(response)),
      tap(quiz => {
        this.addQuizToState(quiz);
        this.setLoading(false);
        console.log('Quiz créé et ajouté à l\'état:', quiz);
      }),
      catchError(this.handleError)
    );
  }

  updateQuiz(id: string, quizData: Partial<Quiz>): Observable<Quiz> {
    this.setLoading(true);
    this.setError(null);
    
    const headers = this.getAuthHeaders();
    const updateData = {
      title: quizData.title?.trim(),
      description: quizData.description?.trim(),
      theme: quizData.theme,
      duration: quizData.duration,
      points: quizData.points,
      imageUrl: quizData.imageUrl?.trim(),
      badge: quizData.badge?.trim(),
      badgeClass: quizData.badgeClass?.trim(),
      status: quizData.status,
      cbus: quizData.cbus || [],
      updatedAt: new Date()
    };

    return this.http.put<any>(`${this.baseUrl}/${id}`, updateData, { headers }).pipe(
      map(response => this.transformQuizFromAPI(response)),
      tap(quiz => {
        this.updateQuizInState(quiz);
        this.setLoading(false);
        console.log('Quiz mis à jour dans l\'état:', quiz);
      }),
      catchError(this.handleError)
    );
  }

  deleteQuiz(id: string): Observable<{ message: string }> {
    this.setLoading(true);
    this.setError(null);
    
    const headers = this.getAuthHeaders();
    
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers }).pipe(
      tap(() => {
        this.removeQuizFromState(id);
        // Supprimer aussi les questions de ce quiz de l'état
        const currentQuestions = this.questionsSubject.value;
        delete currentQuestions[id];
        this.questionsSubject.next({...currentQuestions});
        this.setLoading(false);
        console.log('Quiz supprimé de l\'état:', id);
      }),
      catchError(this.handleError)
    );
  }

  duplicateQuiz(originalQuiz: Quiz): Observable<Quiz> {
    const originalId = originalQuiz.id || originalQuiz._id;
    
    const duplicateData: Partial<Quiz> = {
      title: `${originalQuiz.title} `,
      description: originalQuiz.description,
      theme: originalQuiz.theme,
      duration: originalQuiz.duration,
      points: originalQuiz.points,
      imageUrl: originalQuiz.imageUrl,
      badge: originalQuiz.badge,
      badgeClass: originalQuiz.badgeClass,
      status: 'draft',
      participants: 0,
      cbus: originalQuiz.cbus || [],
      averageScore: 0
    };
  
    return this.createQuiz(duplicateData).pipe(
      switchMap(newQuiz => {
        const newQuizId = newQuiz.id || newQuiz._id;
        // Dupliquer les questions si elles existent
        return this.duplicateQuizQuestions(originalId, newQuizId).pipe(
          map(() => newQuiz),
          catchError(() => [newQuiz]) // Retourner le quiz même si la duplication des questions échoue
        );
      })
    );
  }

  // === MÉTHODES QUESTIONS ===

  getQuestionsByQuiz(quizId: string, forceRefresh: boolean = false): Observable<Question[]> {
    const currentQuestions = this.questionsSubject.value[quizId];
    
    if (!forceRefresh && currentQuestions) {
      return new BehaviorSubject(currentQuestions).asObservable();
    }

    return this.http.get<any[]>(`${this.baseUrl}/${quizId}/questions`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map((questions: any[]) => 
        questions.map(question => this.transformQuestionFromAPI(question))
      ),
      tap(questions => {
        this.updateQuestionsState(quizId, questions);
        // Mettre à jour le nombre de questions dans le quiz
        this.updateQuizQuestionCount(quizId, questions.length);
      }),
      catchError(this.handleError)
    );
  }

  private updateQuizQuestionCount(quizId: string, count: number): void {
    const currentQuizzes = this.quizzesSubject.value;
    const quizIndex = currentQuizzes.findIndex(q => (q.id || q._id) === quizId);
    
    if (quizIndex !== -1) {
      currentQuizzes[quizIndex].questions = count as any;
      this.quizzesSubject.next([...currentQuizzes]);
    }
  }

  createQuestion(quizId: string, questionData: Question): Observable<Question> {
    this.setLoading(true);
    
    const headers = this.getAuthHeaders();
    const preparedQuestion = {
      question: questionData.question.trim(),
      type: questionData.type,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation?.trim(),
      points: questionData.points || 10,
      quizId: quizId
    };
    
    return this.http.post<any>(`${this.baseUrl}/${quizId}/questions`, preparedQuestion, { headers }).pipe(
      map(response => this.transformQuestionFromAPI(response)),
      tap(newQuestion => {
        // Ajouter la question à l'état
        const currentQuestions = this.questionsSubject.value;
        const quizQuestions = currentQuestions[quizId] || [];
        currentQuestions[quizId] = [...quizQuestions, newQuestion];
        this.questionsSubject.next({...currentQuestions});
        
        // Mettre à jour le nombre de questions dans le quiz
        this.updateQuizQuestionCount(quizId, currentQuestions[quizId].length);
        this.setLoading(false);
      }),
      catchError(this.handleError)
    );
  }

  updateQuestion(questionId: string, questionData: Question): Observable<Question> {
    this.setLoading(true);
    
    const headers = this.getAuthHeaders();
    const preparedQuestion = {
      question: questionData.question.trim(),
      type: questionData.type,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation?.trim(),
      points: questionData.points || 10
    };
    
    return this.http.put<any>(`${this.questionsUrl}/${questionId}`, preparedQuestion, { headers }).pipe(
      map(response => this.transformQuestionFromAPI(response)),
      tap(updatedQuestion => {
        // Mettre à jour la question dans l'état
        const currentQuestions = this.questionsSubject.value;
        for (const quizId in currentQuestions) {
          const questions = currentQuestions[quizId];
          const questionIndex = questions.findIndex(q => (q.id || (q as any)._id) === questionId);
          if (questionIndex !== -1) {
            questions[questionIndex] = updatedQuestion;
            this.questionsSubject.next({...currentQuestions});
            break;
          }
        }
        this.setLoading(false);
      }),
      catchError(this.handleError)
    );
  }

  deleteQuestion(questionId: string): Observable<{ message: string }> {
    this.setLoading(true);
    
    const headers = this.getAuthHeaders();
    return this.http.delete<{ message: string }>(`${this.questionsUrl}/${questionId}`, { headers }).pipe(
      tap(() => {
        // Supprimer la question de l'état
        const currentQuestions = this.questionsSubject.value;
        let quizId = '';
        
        for (const qId in currentQuestions) {
          const questions = currentQuestions[qId];
          const questionIndex = questions.findIndex(q => (q.id || (q as any)._id) === questionId);
          if (questionIndex !== -1) {
            questions.splice(questionIndex, 1);
            quizId = qId;
            this.questionsSubject.next({...currentQuestions});
            break;
          }
        }
        
        // Mettre à jour le nombre de questions dans le quiz
        if (quizId) {
          this.updateQuizQuestionCount(quizId, currentQuestions[quizId].length);
        }
        this.setLoading(false);
      }),
      catchError(this.handleError)
    );
  }

  private duplicateQuizQuestions(originalQuizId: string, newQuizId: string): Observable<Question[]> {
    return this.getQuestionsByQuiz(originalQuizId).pipe(
      switchMap(questions => {
        if (questions.length === 0) {
          return of([]);
        }
        const duplicateRequests = questions.map(question => {
          const questionCopy: Question = {
            question: question.question,
            type: question.type,
            options: [...(question.options || [])],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points
          };
          return this.createQuestion(newQuizId, questionCopy);
        });
        return forkJoin(duplicateRequests);
      })
    );
  }

  // === MÉTHODES QUIZ RESULTS ===

  submitQuizResult(quizId: string, answers: { [questionId: string]: string | number }): Observable<QuizResult> {
    this.setLoading(true);
    
    const headers = this.getAuthHeaders();
    const body = { quizId, answers };
    
    return this.http.post<QuizResult>(`${this.baseUrl}/${quizId}/submit`, body, { headers }).pipe(
      tap(result => {
        // Mettre à jour les statistiques du quiz
        this.updateQuizStats(quizId, result);
        this.setLoading(false);
      }),
      catchError(this.handleError)
    );
  }

  finishQuiz(quizId: string, score: number, timeSpent: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { score, timeSpent };
    
    return this.http.post(`${this.baseUrl}/${quizId}/finish`, body, { headers }).pipe(
      tap(() => {
        // Mettre à jour le statut utilisateur du quiz
        this.updateQuizUserStatus(quizId, 'completed').subscribe();
      }),
      catchError(this.handleError)
    );
  }

  getUserQuizResult(quizId: string): Observable<QuizResult> {
    const headers = this.getAuthHeaders();
    return this.http.get<QuizResult>(`${this.baseUrl}/${quizId}/result`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getUserResults(): Observable<QuizResult[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<QuizResult[]>(`${this.baseUrl}/my-results`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
  // Dans quiz.service.ts
getQuestionsByQuizId(quizId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/quizzes/${quizId}/questions`);
}

  // === MÉTHODES STATUT UTILISATEUR ===

  updateQuizUserStatus(quizId: string, status: 'not-started' | 'in-progress' | 'completed'): Observable<Quiz> {
    const headers = this.getAuthHeaders();
    const body = { userStatus: status };
    
    return this.http.patch<any>(`${this.baseUrl}/${quizId}/user-status`, body, { headers }).pipe(
      map(response => this.transformQuizFromAPI(response)),
      tap(quiz => {
        this.updateQuizInState(quiz);
      }),
      catchError(this.handleError)
    );
  }

  private updateQuizStats(quizId: string, result: QuizResult): void {
    const currentQuizzes = this.quizzesSubject.value;
    const quizIndex = currentQuizzes.findIndex(q => (q.id || q._id) === quizId);
    
    if (quizIndex !== -1) {
      const quiz = currentQuizzes[quizIndex];
      // Recalculer les statistiques (simulation - en réalité cela devrait venir du backend)
      const newParticipants = (quiz.participants || 0) + 1;
      const currentTotal = (quiz.averageScore || 0) * (quiz.participants || 0);
      const newAverage = Math.round((currentTotal + result.score) / newParticipants);
      
      currentQuizzes[quizIndex] = {
        ...quiz,
        participants: newParticipants,
        averageScore: newAverage
      };
      
      this.quizzesSubject.next([...currentQuizzes]);
    }
  }

  // === MÉTHODES RECHERCHE ET FILTRAGE ===

  searchQuizzes(searchTerm: string): Observable<Quiz[]> {
    if (!searchTerm.trim()) {
      return this.quizzes$;
    }

    return this.quizzes$.pipe(
      map(quizzes => 
        quizzes.filter(quiz =>
          quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quiz.theme.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }

  filterQuizzes(filters: {
    status?: 'active' | 'draft' | 'archived';
    theme?: 'technique' | 'culture' | 'ludique';
    minQuestions?: number;
    maxDuration?: number;
  }): Observable<Quiz[]> {
    return this.quizzes$.pipe(
      map(quizzes => {
        let filtered = [...quizzes];

        if (filters.status) {
          filtered = filtered.filter(quiz => quiz.status === filters.status);
        }

        if (filters.theme) {
          filtered = filtered.filter(quiz => quiz.theme === filters.theme);
        }

        if (filters.minQuestions !== undefined) {
          filtered = filtered.filter(quiz => {
            const questionCount = Array.isArray(quiz.questions) 
              ? quiz.questions.length 
              : (quiz.questions as any || 0);
            return questionCount >= filters.minQuestions!;
          });
        }

        if (filters.maxDuration !== undefined) {
          filtered = filtered.filter(quiz => quiz.duration <= filters.maxDuration!);
        }

        return filtered;
      })
    );
  }

  // === MÉTHODES STATISTIQUES ===

  getQuizStats(): Observable<{
    totalQuizzes: number;
    activeQuizzes: number;
    draftQuizzes: number;
    archivedQuizzes: number;
    totalQuestions: number;
    averageQuizDuration: number;
    totalParticipants: number;
    averageScore: number;
  }> {
    return this.quizzes$.pipe(
      map(quizzes => {
        const stats = {
          totalQuizzes: quizzes.length,
          activeQuizzes: quizzes.filter(q => q.status === 'active').length,
          draftQuizzes: quizzes.filter(q => q.status === 'draft').length,
          archivedQuizzes: quizzes.filter(q => q.status === 'archived').length,
          totalQuestions: quizzes.reduce((total, quiz) => {
            const questionCount = Array.isArray(quiz.questions) 
              ? quiz.questions.length 
              : (quiz.questions as any || 0);
            return total + questionCount;
          }, 0),
          averageQuizDuration: Math.round(
            quizzes.reduce((total, quiz) => total + (quiz.duration || 0), 0) / quizzes.length
          ),
          totalParticipants: quizzes.reduce((total, quiz) => total + (quiz.participants || 0), 0),
          averageScore: Math.round(
            quizzes
              .filter(quiz => quiz.participants && quiz.participants > 0)
              .reduce((total, quiz) => total + (quiz.averageScore || 0), 0) /
            quizzes.filter(quiz => quiz.participants && quiz.participants > 0).length
          ) || 0
        };
        
        return stats;
      })
    );
  }

  // === MÉTHODES UTILITAIRES ===

  refreshQuizzes(): Observable<Quiz[]> {
    return this.getQuizzes(true);
  }

  refreshQuestions(quizId: string): Observable<Question[]> {
    return this.getQuestionsByQuiz(quizId, true);
  }

  clearError(): void {
    this.setError(null);
  }

  // Méthode pour vérifier la connectivité au backend
  checkBackendConnection(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/health`, { 
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      map(response => response.status === 200),
      catchError(() => [false])
    );
  }

  // Méthode pour synchroniser les données locales avec le backend
  synchronizeData(): Observable<{ quizzes: Quiz[], questions: {[quizId: string]: Question[]} }> {
    return this.getQuizzes(true).pipe(
      switchMap(quizzes => {
        const questionRequests = quizzes.map(quiz => {
          const quizId = quiz.id || quiz._id;
          return this.getQuestionsByQuiz(quizId, true).pipe(
            map(questions => ({ quizId, questions }))
          );
        });

        return forkJoin([
          new BehaviorSubject(quizzes).asObservable(),
          questionRequests.length > 0 ? forkJoin(questionRequests) : new BehaviorSubject([]).asObservable()
        ]);
      }),
      map(([quizzes, questionData]: [Quiz[], any[]]) => {
        const questionsMap: {[quizId: string]: Question[]} = {};
        questionData.forEach(data => {
          questionsMap[data.quizId] = data.questions;
        });
        
        return { quizzes, questions: questionsMap };
      })
    );
  }

  // Nettoyage des ressources
  dispose(): void {
    this.quizzesSubject.complete();
    this.questionsSubject.complete();
    this.loadingSubject.complete();
    this.errorSubject.complete();
  }
}