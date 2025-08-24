import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardUser } from '../../services/leaderboard.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-classement',
  templateUrl: './classement.component.html',
  styleUrls: ['./classement.component.css'],
  imports: [
    NavbarComponent,
    CommonModule,
  ],
})
export class ClassementComponent implements OnInit, OnDestroy {
  leaderboard: LeaderboardUser[] = [];
  loading = true;
  error: string | null = null;
  userRank: { rank: number; totalUsers: number } | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private leaderboardService: LeaderboardService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadLeaderboard();
    this.loadUserRank();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge le classement des top 4 utilisateurs
   */
  loadLeaderboard(): void {
    this.loading = true;
    this.error = null;

    const subscription = this.leaderboardService.getTopUsers(4).subscribe({
      next: (data) => {
        this.leaderboard = data;
        this.loading = false;

        if (data.length === 0) {
          this.error = 'Aucune donnée de classement disponible pour le moment.';
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du classement:', error);
        this.error = 'Erreur lors du chargement du classement. Veuillez réessayer.';
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Charge le rang de l'utilisateur actuel
   */
  loadUserRank(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    const subscription = this.leaderboardService.getUserRank(currentUser.id).subscribe({
      next: (rankInfo) => {
        this.userRank = rankInfo;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du rang utilisateur:', error);
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Rafraîchit les données du classement
   */
  refreshLeaderboard(): void {
    this.loadLeaderboard();
    this.loadUserRank();
  }

  /**
   * Retourne le nom d'affichage avec indication si c'est l'utilisateur actuel
   */


  /**
   * Retourne les informations de rang pour l'utilisateur actuel
   */
  getCurrentUserRankInfo(): string | null {
    const currentUser = this.leaderboard.find(u => u.currentUser);
    if (currentUser) {
      return `Vous êtes ${currentUser.rank}${this.getOrdinalSuffix(currentUser.rank)} sur ${this.userRank?.totalUsers || 'N/A'} participants`;
    } else if (this.userRank) {
      return `Vous êtes ${this.userRank.rank}${this.getOrdinalSuffix(this.userRank.rank)} sur ${this.userRank.totalUsers} participants`;
    }
    return null;
  }

  /**
   * Retourne le suffixe ordinal (er, ème)
   */
  private getOrdinalSuffix(rank: number): string {
    return rank === 1 ? 'er' : 'ème';
  }

  /**
   * Formate le score pour l'affichage
   */
  formatScore(score: number): string {
    return score.toFixed(2) + ' pts ';
  }
  getScoreInfo(user: LeaderboardUser): string {
    return `${user.averageScore.toFixed(2)} pts (${user.completedQuizzes} quiz)`;
  }
  getUserStats(user: LeaderboardUser): string {
    return `Moyenne: ${user.averageScore.toFixed(2)} pts | Total: ${user.totalScore} pts | Quiz: ${user.completedQuizzes}`;
  }
  /**
   * Retourne la classe CSS pour l'animation de l'item
   */
  getItemAnimationClass(index: number): string {
    return `animate-delay-${index * 100}`;
  }
}