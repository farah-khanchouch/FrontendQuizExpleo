import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuizService } from '../../../services/quiz.service';
import { UserService } from '../../../services/user.service';
import { BadgeService } from '../../../services/badge.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', '../../global_styles.css']
})
export class DashboardComponent implements OnInit {
  isLoading = true; 
totalBadges: number = 0;
  constructor(private userService: UserService, private quizService: QuizService, private badgeService: BadgeService) {}

  stats = {
    active: 0,
    activeUsers: 0,
    totalUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    // Ajoutez d'autres stats si nécessaire
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalBadges: 0
    };


    ngOnInit() {
      this.loadQuizzes();
      this.loadUserStats();
      this.loadBadges(); // ajoute cette ligne
    }
    loadBadges() {
      this.badgeService.getBadges().subscribe((badges) => {
        this.totalBadges = badges.length;
      });
    }
  

  loadUserStats() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Utilisateurs chargés pour le dashboard:', users.length);
        
        // Calcul des statistiques
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = users.filter(u => u.status === 'active').length;
        this.stats.inactiveUsers = users.filter(u => u.status === 'inactive').length;
        this.stats.blockedUsers = users.filter(u => u.status === 'blocked').length;
        
        // Stats supplémentaires si vous en avez besoin
        this.stats.totalQuizzes = users.reduce((sum, u) => sum + (u.totalQuizzes || 0), 0);
        this.stats.completedQuizzes = users.reduce((sum, u) => sum + (u.completedQuizzes || 0), 0);
        
        // Score moyen
        const usersWithScores = users.filter(u => u.averageScore && u.averageScore > 0);
        if (usersWithScores.length > 0) {
          this.stats.averageScore = Math.round(
            usersWithScores.reduce((sum, u) => sum + (u.averageScore || 0), 0) / usersWithScores.length
          );
        }

        console.log('Stats calculées:', this.stats);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats utilisateurs:', error);
        // Valeurs par défaut en cas d'erreur
        this.stats = {
          active: 0,
          activeUsers: 0,
          totalUsers: 0,
          inactiveUsers: 0,
          blockedUsers: 0,
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          totalBadges: 0
        };
      }
    });
  }

  // Méthode pour actualiser les stats (optionnel)
  refreshStats() {
    this.loadUserStats();
  }

  // Méthodes utilitaires pour le template
  getCompletionPercentage(): number {
    if (this.stats.totalQuizzes === 0) return 0;
    return Math.round((this.stats.completedQuizzes / this.stats.totalQuizzes) * 100);
  }

  getActiveUserPercentage(): number {
    if (this.stats.totalUsers === 0) return 0;
    return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
  }
  
  quizzes: any[] = []; // ⬅️ ajoute cette ligne


  

  loadQuizzes() {
    this.quizService.getQuizzes().subscribe((data: any[]) => {
      this.quizzes = data;
    });
  }
}

