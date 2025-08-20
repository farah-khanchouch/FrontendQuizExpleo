import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { StatsService, UserStatistics, QuizResult, ThemeStats } from '../../services/stats.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
  imports: [NavbarComponent, CommonModule, RouterModule],
})
export class StatsComponent implements OnInit, OnDestroy {
  stats: UserStatistics | null = null;
  isLoading = false;

  private statsSubscription: Subscription | null = null;

  constructor(private statsService: StatsService) { }

  ngOnInit(): void {
    // Se désabonner d'abord pour éviter les fuites de mémoire
    if (this.statsSubscription) {
        this.statsSubscription.unsubscribe();
    }
    
    // Recréer la souscription
    this.statsSubscription = this.statsService.stats$.subscribe(stats => {
        this.stats = stats;
    });
    
    // Forcer le rechargement des statistiques
    this.loadStatistics(true);
}

  ngOnDestroy(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  private subscribeToStats(): void {
    this.statsSubscription = this.statsService.stats$.subscribe(stats => {
      this.stats = stats;
    });
  }
  private loadStatistics(forceReload = false): void {
    this.isLoading = true;
    this.statsService.loadUserStatistics(forceReload).subscribe({
        next: () => {
            this.isLoading = false;
        },
        error: (error) => {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.isLoading = false;
        }
    });
}

  getThemeDisplayName(theme: string): string {
    const themeNames: { [key: string]: string } = {
      'technique': 'Technique',
      'culture': 'Culture Générale',
      'securite': 'Sécurité',
      'general': 'Général',
      'management': 'Management',
      'communication': 'Communication'
    };
    return themeNames[theme] || theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  // Méthodes pour le template - Métriques globales
  get totalQuizzesCompleted(): number {
    return this.stats?.totalQuizzesCompleted ?? 0;
  }

  get totalQuizzesAvailable(): number {
    return this.stats?.totalQuizzesAvailable ?? 0;
  }

  get averageScore(): number {
    return this.stats?.averageScore ?? 0;
  }

  get bestScore(): number {
    return this.stats?.bestScore ?? 0;
  }

  get globalCompletionRate(): number {
    if (!this.stats || this.stats.totalQuizzesAvailable === 0) return 0;
    return Math.round((this.stats.totalQuizzesCompleted / this.stats.totalQuizzesAvailable) * 100);
  }

  get completionText(): string {
    if (!this.stats) return '0/0';
    return `${this.stats.totalQuizzesCompleted}/${this.stats.totalQuizzesAvailable}`;
  }

  get totalTimeSpent(): number {
    return this.stats?.totalTimeSpent ?? 0;
  }

  get themeStats(): ThemeStats[] {
    return this.stats?.themeStats ?? [];
  }

  get weeklyStats() {
    return this.stats?.weeklyStats ?? [];
  }

  get recentResults(): QuizResult[] {
    return this.stats?.recentResults ?? [];
  }

  get bestResults() {
    return this.stats?.bestResults ?? [];
  }

  get performanceMetrics() {
    return this.stats?.performanceMetrics ?? {
      consistency: 0,
      improvement: 0,
      speedAccuracy: 0,
      strengths: [],
      weaknesses: [],
      recommendations: []
    };
  }

  // Méthodes utilitaires pour l'affichage
  getFormattedTotalTime(): string {
    const totalSeconds = this.totalTimeSpent;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#10b981'; // vert
    if (percentage >= 60) return '#3b82f6'; // bleu  
    if (percentage >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // rouge
  }

  getWeeklyChartHeight(weekStat: any): string {
    if (this.weeklyStats.length === 0) return '0%';

    const maxCount = Math.max(...this.weeklyStats.map(w => w.quizCount), 1);
    const percentage = (weekStat.quizCount / maxCount) * 100;
    return `${Math.max(percentage, 10)}%`;
  }

  getTotalQuestionsAnswered(): number {
    return this.recentResults.reduce((total, result) => total + result.totalQuestions, 0);
  }

  getAverageTimePerQuiz(): string {
    if (this.totalQuizzesCompleted === 0) return '0s';
    const avgTime = Math.round(this.totalTimeSpent / this.totalQuizzesCompleted);
    return `${avgTime}s`;
  }

  getAverageQuizzesPerWeek(): string {
    if (this.weeklyStats.length === 0) return '0';
    const avgQuizzes = this.weeklyStats.reduce((total, week) => total + week.quizCount, 0) / this.weeklyStats.length;
    return avgQuizzes.toFixed(1);
  }

  // Nouvelles méthodes basées sur le service
  getConsistencyLevel(): string {
    const consistency = this.performanceMetrics.consistency;
    if (consistency >= 80) return 'Très régulier';
    if (consistency >= 60) return 'Assez régulier';
    if (consistency >= 40) return 'Irrégulier';
    return 'Très irrégulier';
  }

  getImprovementTrend(): { icon: string, text: string, color: string } {
    const improvement = this.performanceMetrics.improvement;
    if (improvement > 10) return { icon: '📈', text: 'En forte progression', color: '#10b981' };
    if (improvement > 5) return { icon: '📊', text: 'En progression', color: '#3b82f6' };
    if (improvement > -5) return { icon: '📊', text: 'Stable', color: '#6b7280' };
    if (improvement > -10) return { icon: '📉', text: 'En légère baisse', color: '#f59e0b' };
    return { icon: '📉', text: 'En baisse', color: '#ef4444' };
  }

  getPerformanceLevel(): string {
    const avgScore = this.averageScore;
    if (avgScore >= 90) return 'Expert';
    if (avgScore >= 80) return 'Avancé';
    if (avgScore >= 70) return 'Intermédiaire';
    if (avgScore >= 60) return 'Débutant+';
    return 'Débutant';
  }

  getStrengthsText(): string {
    const strengths = this.performanceMetrics.strengths;
    if (strengths.length === 0) return 'Continuez vos efforts pour identifier vos points forts';
    if (strengths.length === 1) return `Votre point fort : ${strengths[0]}`;
    return `Vos points forts : ${strengths.slice(0, -1).join(', ')} et ${strengths[strengths.length - 1]}`;
  }

  getWeaknessesText(): string {
    const weaknesses = this.performanceMetrics.weaknesses;
    if (weaknesses.length === 0) return 'Aucun point faible identifié, bravo !';
    if (weaknesses.length === 1) return `À améliorer : ${weaknesses[0]}`;
    return `À améliorer : ${weaknesses.slice(0, -1).join(', ')} et ${weaknesses[weaknesses.length - 1]}`;
  }

  getMotivationalMessage(): string {
    const completionRate = this.globalCompletionRate;
    const avgScore = this.averageScore;

    if (completionRate >= 100 && avgScore >= 90) {
      return '🏆 Félicitations ! Vous maîtrisez parfaitement tous les sujets !';
    }
    if (completionRate >= 80 && avgScore >= 80) {
      return '🌟 Excellent travail ! Vous êtes sur la bonne voie pour tout maîtriser !';
    }
    if (completionRate >= 50 || avgScore >= 70) {
      return '💪 Bonne progression ! Continuez vos efforts, vous progressez bien !';
    }
    if (this.totalQuizzesCompleted > 0) {
      return '🎯 C\'est un bon début ! Chaque quiz vous fait progresser !';
    }
    return '🚀 Prêt à commencer votre parcours d\'apprentissage ?';
  }

  // Méthodes pour la comparaison et l'analyse
  getThemeComparison(): { best: ThemeStats | null, worst: ThemeStats | null } {
    if (this.themeStats.length === 0) return { best: null, worst: null };

    const withResults = this.themeStats.filter(t => t.quizCount > 0);
    if (withResults.length === 0) return { best: null, worst: null };

    const best = withResults.reduce((max, theme) =>
      theme.averageScore > max.averageScore ? theme : max
    );

    const worst = withResults.reduce((min, theme) =>
      theme.averageScore < min.averageScore ? theme : min
    );

    return { best, worst };
  }

  getProgressionComparison(): {
    trending: 'up' | 'down' | 'stable',
    message: string,
    color: string
  } {
    const service = this.statsService;
    const analysis = service.getProgressionAnalysis(30);

    let message = '';
    let color = '#6b7280';

    switch (analysis.trend) {
      case 'improving':
        message = `Progression de ${analysis.scoreEvolution.toFixed(1)}% ce mois-ci`;
        color = '#10b981';
        break;
      case 'declining':
        message = `Baisse de ${Math.abs(analysis.scoreEvolution).toFixed(1)}% ce mois-ci`;
        color = '#ef4444';
        break;
      case 'stable':
        message = 'Performances stables ce mois-ci';
        color = '#3b82f6';
        break;
    }

    return {
      trending: analysis.trend === 'improving' ? 'up' : analysis.trend === 'declining' ? 'down' : 'stable',
      message,
      color
    };
  }

  // Méthodes pour les actions
  refreshStats(): void {
    this.loadStatistics();
  }

  getRecommendationIcon(recommendation: string): string {
    if (recommendation.includes('révision') || recommendation.includes('base')) return '📖';
    if (recommendation.includes('régularité') || recommendation.includes('régulier')) return '📊';
    if (recommendation.includes('challenger') || recommendation.includes('nouveau')) return '🚀';
    if (recommendation.includes('approfondir') || recommendation.includes('connaissances')) return '🔍';
    return '💡';
  }

  getRecommendationPriority(index: number): string {
    if (index === 0) return 'Priorité haute';
    if (index === 1) return 'Priorité moyenne';
    return 'À considérer';
  }

  // Méthodes pour l'affichage des tendances
  getWeekTrend(week: any, index: number): { icon: string, color: string } {
    if (index === this.weeklyStats.length - 1) return { icon: '', color: '' };

    const improvement = week.improvementFromPrevious;
    if (improvement > 5) return { icon: '▲', color: '#10b981' };
    if (improvement < -5) return { icon: '▼', color: '#ef4444' };
    return { icon: '●', color: '#6b7280' };
  }

  getThemeProgress(theme: ThemeStats): {
    width: string,
    color: string,
    status: string
  } {
    const completionRate = theme.completionRate;
    return {
      width: `${completionRate}%`,
      color: this.getProgressColor(completionRate),
      status: completionRate === 100 ? 'Terminé' :
        completionRate >= 80 ? 'Presque fini' :
          completionRate >= 50 ? 'En cours' : 'À commencer'
    };
  }

  // Méthodes pour le formatage
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}min ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  // Méthodes pour l'interaction
  onRefreshClick(): void {
    this.refreshStats();
  }

  onViewQuizList(): void {
    // Navigation vers la liste des quiz
  }

  onRetakeQuiz(quizId: string): void {
    // Navigation vers le quiz spécifique
  }

  onViewThemeDetails(theme: string): void {
    // Navigation vers les détails du thème
  }

  // Getters calculés pour l'affichage
  get hasData(): boolean {
    return this.totalQuizzesCompleted > 0;
  }

  get completionMessage(): string {
    if (this.globalCompletionRate >= 100) {
      return '🎉 Tous les quiz terminés !';
    }
    const remaining = this.totalQuizzesAvailable - this.totalQuizzesCompleted;
    return `${remaining} quiz restant${remaining > 1 ? 's' : ''}`;
  }

  get performanceGrade(): { letter: string, color: string, description: string } {
    const score = this.averageScore;
    if (score >= 90) return { letter: 'A', color: '#10b981', description: 'Excellent' };
    if (score >= 80) return { letter: 'B', color: '#3b82f6', description: 'Très bien' };
    if (score >= 70) return { letter: 'C', color: '#f59e0b', description: 'Bien' };
    if (score >= 60) return { letter: 'D', color: '#f59e0b', description: 'Passable' };
    return { letter: 'F', color: '#ef4444', description: 'À améliorer' };
  }

  get studyStreak(): number {
    // Calculer la série d'étude (jours consécutifs avec au moins un quiz)
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dayResults = this.recentResults.filter(result => {
        const resultDate = new Date(result.completedAt);
        return resultDate.toDateString() === currentDate.toDateString();
      });

      if (dayResults.length === 0) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);

      if (streak > 30) break; // Limite de sécurité
    }

    return streak;
  }

  get nextMilestone(): { target: number, current: number, description: string } | null {
    const milestones = [
      { target: 5, description: 'Premier jalon' },
      { target: 10, description: 'Découvreur' },
      { target: 25, description: 'Apprenant régulier' },
      { target: 50, description: 'Expert en formation' },
      { target: 100, description: 'Maître quiz' }
    ];

    const current = this.totalQuizzesCompleted;
    const next = milestones.find(m => m.target > current);

    return next ? { ...next, current } : null;
  }
}