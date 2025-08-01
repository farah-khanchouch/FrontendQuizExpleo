import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Quiz, Question, QuizResult, Badge } from '../../models/quiz.model';
import { HttpClient ,HttpHeaders} from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})

export class QuizService {
  
  private baseUrl = 'http://localhost:3000/api/quizzes';

  constructor(private http: HttpClient) {}

 

  // Récupérer un quiz par son id
  getQuizById(id: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/${id}`);
  }

  // Récupérer les questions d'un quiz
  getQuestionsByQuiz(quizId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.baseUrl}/${quizId}/questions`);
  }

  // Créer une nouvelle question pour un quiz (nécessite token et rôle admin)
  createQuestion(quizId: string, questionData: Question): Observable<Question> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<Question>(`${this.baseUrl}/${quizId}/questions`, questionData, { headers });
  }

  // Mettre à jour une question (nécessite token et rôle admin)
  updateQuestion(questionId: string, questionData: Question): Observable<Question> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<Question>(`${this.baseUrl}/questions/${questionId}`, questionData, { headers });
  }
  updateQuiz(id: string, quizData: any): Observable<Quiz> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<Quiz>(`${this.baseUrl}/${id}`, quizData, { headers });
  }
  
  deleteQuiz(id: string): Observable<{ message: string }> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers });
  }
  

  // Supprimer une question (nécessite token et rôle admin)
  deleteQuestion(questionId: string): Observable<{ message: string }> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<{ message: string }>(`${this.baseUrl}/questions/${questionId}`, { headers });
  }
  submitQuizResult(quizId: string, answers: { [questionId: string]: string }): Observable<any> {
    const body = { quizId, answers };
    // Ici, remplace l'URL par l'endpoint correct de ton API backend
    return this.http.post('/api/quizzes/' + quizId + '/submit', body);
  }
 // quiz.service.ts
createQuiz(quizData: any): Observable<Quiz> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
  
  return this.http.post('http://localhost:3000/api/quizzes', quizData, { headers })
    .pipe(
      map((response: any) => {
        // Convertir _id en id pour correspondre à votre interface
        return {
          ...response,
          id: response._id,  // Mapper _id vers id
          _id: undefined     // Optionnel: supprimer _id
        } as Quiz;
      })
    );
}

getQuizzes(): Observable<Quiz[]> {
  return this.http.get<any[]>(this.baseUrl)
    .pipe(
      map((quizzes: any[]) => 
        quizzes.map(quiz => ({
          ...quiz,
          id: quiz._id,
          _id: undefined
        }))
      )
    );
}

// Même chose pour les autres méthodes...

  // Soumettre le résultat d'un quiz (score + temps passé)
  finishQuiz(score: number, timeSpent: number): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body = { score, timeSpent };
    return this.http.post('http://localhost:3000/api/quizzes/finish', body, { headers });
  }
  }