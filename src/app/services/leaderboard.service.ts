import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface LeaderboardUser {
  rank: number;
  userId: string;
  userName: string;
  userCbu?: string;
  totalScore: number;
  averageScore: number;
  completedQuizzes: number;
  avatar?: string;
  medal?: string;
  podium?: string;
  currentUser?: boolean;
}

export interface UserResult {
  userId: string;
  userName: string;
  userCbu?: string;
  score: number;
  completedAt: Date;
  quizId: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = 'https://quizonexpleo.up.railway.app/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Récupère le classement des top utilisateurs
   */
  getTopUsers(limit: number = 4): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(`${this.apiUrl}/leaderboard/top/${limit}`).pipe(
      map(results => this.processLeaderboardForDisplay(results)),
      catchError(error => {
        console.error('Erreur lors du chargement du classement:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère le classement complet
   */
  getFullLeaderboard(): Observable<LeaderboardUser[]> {
    return this.http.get<LeaderboardUser[]>(`${this.apiUrl}/leaderboard`).pipe(
      map(results => this.processLeaderboardForDisplay(results)),
      catchError(error => {
        console.error('Erreur lors du chargement du classement complet:', error);
        return of([]);
      })
    );
  }

  /**
   * Traite les données du classement pour l'affichage
   */
  // Dans leaderboard.service.ts
  private processLeaderboardForDisplay(results: any[]): LeaderboardUser[] {
    const currentUser = this.authService.getCurrentUser();

    return results.map((user, index) => {
      // Vérifier si c'est l'utilisateur actuel en comparant l'ID ou le CBU
      let isCurrentUser = false;
      if (currentUser) {
        isCurrentUser = (currentUser.id === user.userId || currentUser._id === user.userId) ||
          (currentUser.cbu === user.userCbu);
      }

      // Utiliser le nom d'utilisateur ou le CBU comme fallback
      const displayName = user.userName || user.userCbu || 'Utilisateur inconnu';

      return {
        rank: user.rank || (index + 1),
        userId: user.userId,
        userName: displayName,
        userCbu: user.userCbu,
        totalScore: user.totalScore || 0,
        averageScore: user.averageScore || 0,
        completedQuizzes: user.completedQuizzes || 0,
        avatar: this.generateAvatar(displayName),
        medal: this.getMedal(user.rank || (index + 1)),
        podium: this.getPodiumClass(user.rank || (index + 1)),
        currentUser: isCurrentUser
      };
    });
  }
  /**
   * Génère un avatar par défaut basé sur le nom
   */
  private generateAvatar(name: string): string {
    const initials = name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=50&background=4f46e5&color=fff&bold=true`;
  }

  /**
   * Retourne l'emoji de médaille selon le rang
   */
  private getMedal(rank: number): string | undefined {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return undefined;
    }
  }

  /**
   * Retourne la classe CSS du podium selon le rang
   */
  private getPodiumClass(rank: number): string | undefined {
    switch (rank) {
      case 1: return 'first';
      case 2: return 'second';
      case 3: return 'third';
      default: return undefined;
    }
  }

  /**
   * Récupère la position d'un utilisateur spécifique dans le classement complet
   */
  getUserRank(userId: string): Observable<{ rank: number; totalUsers: number } | null> {
    return this.http.get<{ rank: number; totalUsers: number; userStats: any }>(`${this.apiUrl}/leaderboard/user/${userId}/rank`).pipe(
      map(response => ({
        rank: response.rank,
        totalUsers: response.totalUsers
      })),
      catchError(error => {
        console.error('Erreur lors du calcul du rang utilisateur:', error);
        return of(null);
      })
    );
  }

  /**
   * Récupère les statistiques générales de la plateforme
   */
  getGeneralStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaderboard/stats`).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques générales:', error);
        return of({
          totalQuizzes: 0,
          totalUsers: 0,
          averageScore: 0,
          bestScore: 0,
          totalPointsDistributed: 0,
          totalTimeSpent: 0
        });
      })
    );
  }
}