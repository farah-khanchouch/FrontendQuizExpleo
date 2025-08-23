import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardService, DashboardData, DashboardStats, RecentActivity, RecommendedQuiz, LearningPathStep, TopPerformer, Achievement, QuickAction } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Données du dashboard
  dashboardData: DashboardData | null = null;
  user: any = null;
  isLoading = true;

  // Souscriptions
  private dashboardSubscription: Subscription | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Initialisation du Dashboard');
    
    // Récupérer l'utilisateur connecté
    this.user = this.authService.getCurrentUser();
    
    if (!this.user) {
      console.error('Aucun utilisateur connecté');
      this.router.navigate(['/login']);
      return;
    }

    // Souscrire aux données du dashboard
    this.subscribeToDashboard();
    
    // Charger les données initiales
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.dashboardSubscription) {
      this.dashboardSubscription.unsubscribe();
    }
  }

  private subscribeToDashboard(): void {
    this.dashboardSubscription = this.dashboardService.dashboardData$.subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
        console.log('Données dashboard reçues:', data);
      },
      error: (error) => {
        console.error('Erreur lors de la réception des données dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.loadDashboardData().subscribe({
      next: (data) => {
        console.log('Dashboard chargé avec succès');
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  // Getters pour l'accès aux données dans le template
  get stats(): DashboardStats {
    return this.dashboardData?.stats || {
      quizCompleted: 0,
      averageScore: 0,
      ranking: 0,
      totalTime: '0min'
    };
  }

  get recentActivities(): RecentActivity[] {
    return this.dashboardData?.recentActivities || [];
  }

  get recommendedQuizzes(): RecommendedQuiz[] {
    return this.dashboardData?.recommendedQuizzes || [];
  }

  get learningPath(): LearningPathStep[] {
    return this.dashboardData?.learningPath || [];
  }

  get topPerformers(): TopPerformer[] {
    return this.dashboardData?.topPerformers || [];
  }

  get achievements(): Achievement[] {
    return this.dashboardData?.achievements || [];
  }

  get quickActions(): QuickAction[] {
    return this.dashboardData?.quickActions || [];
  }

  get quizzesThisWeek(): number {
    return this.dashboardData?.quizzesThisWeek || 0;
  }

  get scoreEvolution(): number {
    return this.dashboardData?.scoreEvolution || 0;
  }

  get rankingTrend(): string {
    return this.dashboardData?.rankingTrend || 'Nouveau';
  }

  get timeSpentThisWeek(): number {
    return this.dashboardData?.timeSpentThisWeek || 0;
  }

  // Méthodes pour la navigation
  navigateToQuiz(quizId: string): void {
    this.router.navigate(['/quiz', quizId]);
  }

  navigateToQuizzes(): void {
    this.router.navigate(['/quizzes']);
  }

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  // Méthodes pour les actions du quiz
  startQuiz(quiz: RecommendedQuiz): void {
    this.router.navigate(['/quiz', quiz.id]);
  }

  continueQuiz(quiz: RecommendedQuiz): void {
    this.router.navigate(['/quiz', quiz.id]);
  }

  retakeQuiz(quiz: RecommendedQuiz): void {
    this.router.navigate(['/quiz', quiz.id]);
  }

  // Méthodes pour les actions rapides
  executeQuickAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  // Méthodes utilitaires pour l'affichage
  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate';
      case 'expert': return 'expert';
      default: return 'intermediate';
    }
  }

  getDifficultyText(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'expert': return 'Expert';
      default: return 'Intermédiaire';
    }
  }

  getBadgeClass(badge: string): string {
    switch (badge) {
      case 'new': return 'new';
      case 'trending': return 'trending';
      case 'popular': return 'popular';
      default: return 'popular';
    }
  }

  getBadgeText(badge: string): string {
    switch (badge) {
      case 'new': return 'Nouveau';
      case 'trending': return 'Tendance';
      case 'popular': return 'Populaire';
      default: return 'Populaire';
    }
  }

  getQuizButtonText(quiz: RecommendedQuiz): string {
    if (quiz.progress === 0) return 'Commencer';
    if (quiz.progress === 100) return 'Refaire';
    return 'Continuer';
  }

  getQuizButtonClass(quiz: RecommendedQuiz): string {
    return quiz.progress === 0 ? 'btn-primary' : 'btn-secondary';
  }

  getStepStatusClass(step: LearningPathStep): string {
    return step.status;
  }

  getPerformerClass(performer: TopPerformer): string {
    let classes = '';
    
    if (performer.rank === '🥇') classes += 'gold ';
    else if (performer.rank === '🥈') classes += 'silver ';
    else if (performer.rank === '🥉') classes += 'bronze ';
    
    if (performer.current) classes += 'current';
    
    return classes.trim();
  }

  getAchievementClass(achievement: Achievement): string {
    return achievement.earned ? 'earned' : 'locked';
  }

  // Méthodes pour le rafraîchissement
  refreshDashboard(): void {
    this.isLoading = true;
    this.dashboardService.refreshDashboard().subscribe({
      next: () => {
        console.log('Dashboard rafraîchi avec succès');
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
        this.isLoading = false;
      }
    });
  }

  // Méthodes pour les informations utilisateur
  get username(): string {
    return this.user?.username || 'Invité';
  }

  get userBadges(): any[] {
    return this.user?.badges || [];
  }

  // Méthodes pour les statistiques d'évolution
  getScoreEvolutionClass(): string {
    if (this.scoreEvolution > 0) return 'positive';
    if (this.scoreEvolution < 0) return 'negative';
    return 'neutral';
  }

  getScoreEvolutionText(): string {
    if (this.scoreEvolution > 0) return `+${this.scoreEvolution}%`;
    if (this.scoreEvolution < 0) return `${this.scoreEvolution}%`;
    return '0%';
  }

  // Méthodes pour les badges et récompenses
  hasBadges(): boolean {
    return this.userBadges.length > 0;
  }

  getEarnedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.earned);
  }

  getLockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.earned);
  }

  // Méthodes pour la gestion des erreurs et états
  get hasError(): boolean {
    return !this.isLoading && !this.dashboardData;
  }

  get isEmpty(): boolean {
    if (this.isLoading || !this.dashboardData) return false;
    return this.stats.quizCompleted === 0 && this.recommendedQuizzes.length === 0;
  }

  get hasRecommendations(): boolean {
    return this.recommendedQuizzes.length > 0;
  }

  get hasActivities(): boolean {
    return this.recentActivities.length > 0;
  }

  get hasAchievements(): boolean {
    return this.achievements.length > 0;
  }

  get hasLearningPath(): boolean {
    return this.learningPath.length > 0;
  }

  // Méthodes pour les messages d'encouragement
  getMotivationalMessage(): string {
    const completedQuizzes = this.stats.quizCompleted;
    const averageScore = this.stats.averageScore;

    if (completedQuizzes === 0) {
      return "🚀 Prêt à commencer votre parcours d'apprentissage ?";
    } else if (completedQuizzes < 5) {
      return "🎯 Bon début ! Continuez sur cette lancée !";
    } else if (averageScore >= 80) {
      return "🌟 Excellent travail ! Vos performances sont remarquables !";
    } else if (averageScore >= 60) {
      return "💪 Bonne progression ! Continuez vos efforts !";
    } else {
      return "📚 Chaque quiz vous fait progresser, persévérez !";
    }
  }

  // Méthodes pour les actions contextuelles
  onQuizAction(quiz: RecommendedQuiz): void {
    if (quiz.progress === 0) {
      this.startQuiz(quiz);
    } else if (quiz.progress === 100) {
      this.retakeQuiz(quiz);
    } else {
      this.continueQuiz(quiz);
    }
  }

  onViewFullLeaderboard(): void {
    this.navigateToLeaderboard();
  }

  onViewStats(): void {
    this.navigateToStats();
  }

  onStartQuiz(): void {
    this.navigateToQuizzes();
  }

  // Méthodes de debug (à supprimer en production)
  logDashboardData(): void {
    console.log('Dashboard Data:', this.dashboardData);
  }

  logUserInfo(): void {
    console.log('User Info:', this.user);
  }
}