import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { delay, map, catchError } from 'rxjs/operators';

// Modèle User mis à jour avec des propriétés calculées
export interface User {
  id: string;
  _id?: string; // Pour compatibilité MongoDB
  username: string;
  email: string;
  avatar?: string;
  cbu?: string;
  totalPoints?: number;
  joinedAt: string;

  // Propriétés calculées dynamiquement
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  badges: number;
  status: 'active' | 'inactive' | 'blocked';
  lastActivity: string;

  // Nouvelles propriétés pour plus de détails
  bestScore?: number;
  totalTimeSpent?: number;
  completionRate?: number;
}

// Interface pour les résultats de quiz
interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  timeSpent: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://quizonexpleo.up.railway.app/api/users';
  private quizResultsUrl = 'https://quizonexpleo.up.railway.app/api/quiz-results';
  private quizUrl = 'https://quizonexpleo.up.railway.app/api/quiz';

  constructor(private http: HttpClient) { }

  // ✅ NOUVELLE MÉTHODE : Récupérer tous les utilisateurs avec leurs vraies statistiques
  // Dans user.service.ts, remplacez la méthode getAllUsers par :
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/../stats/users`).pipe(
      map(users => {
        console.log('Utilisateurs avec vraies stats:', users);
        return users;
      })
    );
  }
  // ✅ NOUVELLE MÉTHODE : Calculer les statistiques d'un utilisateur
  private calculateUserStats(userResults: QuizResult[], availableQuizzes: any[]): Partial<User> {
    const completedQuizzes = userResults.length;
    const totalQuizzes = availableQuizzes.length;

    let averageScore = 0;
    let bestScore = 0;
    let totalTimeSpent = 0;
    let badges = 0;
    let lastActivity = '';

    if (completedQuizzes > 0) {
      // Calculer le score moyen
      const totalScore = userResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
      averageScore = Math.round(totalScore / completedQuizzes);

      // Trouver le meilleur score
      bestScore = Math.max(...userResults.map(r => r.percentage || 0));

      // Calculer le temps total
      totalTimeSpent = userResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0);

      // Calculer les badges (exemple : 1 badge par tranche de 10 points de moyenne)
      badges = Math.floor(averageScore / 10);

      // Trouver la dernière activité
      const lastResult = userResults.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];
      lastActivity = lastResult.completedAt;
    }

    const completionRate = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      bestScore,
      badges,
      totalTimeSpent,
      completionRate,
      lastActivity: lastActivity || new Date().toISOString()
    };
  }

  // ✅ Récupérer les statistiques détaillées d'un utilisateur spécifique
  getUserStats(userId: string): Observable<{
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    badges: number;
    lastQuizDate?: string;
    bestScore: number;
    completionRate: number;
    totalTimeSpent: number;
  }> {
    return forkJoin({
      userResults: this.http.get<QuizResult[]>(`${this.quizResultsUrl}/${userId}`).pipe(
        catchError(() => of([]))
      ),
      user: this.http.get<User>(`${this.apiUrl}/${userId}`),
      availableQuizzes: this.http.get<any[]>(this.quizUrl).pipe(
        catchError(() => of([]))
      )
    }).pipe(
      map(({ userResults, user, availableQuizzes }) => {
        const userQuizzes = availableQuizzes.filter(quiz =>
          quiz.status === 'active' &&
          quiz.cbus &&
          quiz.cbus.includes(user.cbu)
        );

        const stats = this.calculateUserStats(userResults, userQuizzes);

        return {
          totalQuizzes: stats.totalQuizzes || 0,
          completedQuizzes: stats.completedQuizzes || 0,
          averageScore: stats.averageScore || 0,
          badges: stats.badges || 0,
          bestScore: stats.bestScore || 0,
          completionRate: stats.completionRate || 0,
          totalTimeSpent: stats.totalTimeSpent || 0,
          lastQuizDate: stats.lastActivity
        };
      })
    );
  }

  // ✅ NOUVEAU : Synchroniser les stats d'un utilisateur
  syncUserStats(userId: string): Observable<User> {
    return this.getUserStats(userId).pipe(
      map(stats => {
        // Ici, vous pourriez sauvegarder les stats calculées en base si nécessaire
        console.log(`📊 Stats synchronisées pour ${userId}:`, stats);
        return { id: userId, ...stats } as User;
      })
    );
  }

  // ✅ NOUVEAU : Forcer le recalcul des statistiques pour tous les utilisateurs
  recalculateAllStats(): Observable<User[]> {
    return this.getAllUsers();
  }

  // ✅ Récupérer un utilisateur par ID avec ses vraies stats
  getUserById(id: string): Observable<User> {
    return forkJoin({
      user: this.http.get<User>(`${this.apiUrl}/${id}`),
      stats: this.getUserStats(id)
    }).pipe(
      map(({ user, stats }) => ({
        ...user,
        ...stats
      }))
    );
  }

  // ✅ Mettre à jour un utilisateur
  updateUser(id: string, updatedUser: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, updatedUser);
  }

  // ✅ Mettre à jour le profil complet
  updateProfile(userId: string, profileData: {
    username?: string;
    email?: string;
    cbu?: string;
    avatar?: string
  }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/profile`, profileData);
  }

  // ✅ Mettre à jour uniquement l'avatar
  updateAvatar(userId: string, avatar: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, { avatar });
  }

  // ✅ Supprimer un utilisateur
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ Créer un utilisateur
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // ✅ NOUVEAU : Obtenir les détails d'activité d'un utilisateur
  getUserActivity(userId: string, limit: number = 10): Observable<QuizResult[]> {
    return this.http.get<QuizResult[]>(`${this.quizResultsUrl}/${userId}?limit=${limit}`).pipe(
      map(results => results.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ))
    );
  }

  // ✅ NOUVEAU : Obtenir les statistiques globales de tous les utilisateurs
  getGlobalStats(): Observable<{
    totalUsers: number;
    activeUsers: number;
    totalQuizzesTaken: number;
    averageGlobalScore: number;
  }> {
    return this.getAllUsers().pipe(
      map(users => {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const totalQuizzesTaken = users.reduce((sum, u) => sum + u.completedQuizzes, 0);

        const usersWithQuizzes = users.filter(u => u.completedQuizzes > 0);
        const averageGlobalScore = usersWithQuizzes.length > 0
          ? Math.round(usersWithQuizzes.reduce((sum, u) => sum + u.averageScore, 0) / usersWithQuizzes.length)
          : 0;

        return {
          totalUsers,
          activeUsers,
          totalQuizzesTaken,
          averageGlobalScore
        };
      })
    );
  }
}