import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { QuizService } from './quiz.service';
import { StatsService } from './stats.service';
import { AuthService } from './auth.service';
import { Quiz } from '../../models/quiz.model';

export interface DashboardStats {
  quizCompleted: number;
  averageScore: number;
  ranking: number;
  totalTime: string;
}

export interface RecentActivity {
  type: 'success' | 'info' | 'warning';
  title: string;
  description: string;
  time: string;
}

export interface RecommendedQuiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  duration: number;
  questions: number;
  rating: number;
  progress: number;
  status: string;
  badge: 'new' | 'trending' | 'popular';
}

export interface LearningPathStep {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  statusText: string;
}

export interface TopPerformer {
  rank: string;
  name: string;
  points: string;
  avatar: string;
  current: boolean;
}

export interface Achievement {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  date?: string;
  progress?: string;
}

export interface QuickAction {
  icon: 'brain' | 'chart' | 'user' | 'settings';
  title: string;
  description: string;
  route: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  recommendedQuizzes: RecommendedQuiz[];
  learningPath: LearningPathStep[];
  topPerformers: TopPerformer[];
  achievements: Achievement[];
  quickActions: QuickAction[];
  quizzesThisWeek: number;
  scoreEvolution: number;
  rankingTrend: string;
  timeSpentThisWeek: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  constructor(
    private quizService: QuizService,
    private statsService: StatsService,
    private authService: AuthService
  ) {}

  loadDashboardData(): Observable<DashboardData> {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      return of(this.getDefaultDashboardData());
    }

    return combineLatest([
      this.statsService.stats$,
      this.quizService.getQuizzes(),
      this.getRecentActivities(),
      this.getTopPerformers()
    ]).pipe(
      map(([stats, allQuizzes, activities, performers]) => {
        // Filtrer les quiz pour l'utilisateur
        const userQuizzes = this.filterQuizzesForUser(allQuizzes, user);
        
        const dashboardData: DashboardData = {
          stats: this.buildStats(stats),
          recentActivities: activities,
          recommendedQuizzes: this.buildRecommendedQuizzes(userQuizzes, stats),
          learningPath: this.buildLearningPath(userQuizzes, stats),
          topPerformers: performers,
          achievements: this.buildAchievements(stats),
          quickActions: this.buildQuickActions(),
          quizzesThisWeek: this.getQuizzesThisWeek(stats),
          scoreEvolution: this.getScoreEvolution(stats),
          rankingTrend: this.getRankingTrend(stats),
          timeSpentThisWeek: this.getTimeSpentThisWeek(stats)
        };

        this.dashboardDataSubject.next(dashboardData);
        return dashboardData;
      }),
      catchError(error => {
        console.error('Erreur lors du chargement du dashboard:', error);
        return of(this.getDefaultDashboardData());
      })
    );
  }

  private filterQuizzesForUser(quizzes: Quiz[], user: any): Quiz[] {
    if (!user.cbu) return [];
    
    return quizzes.filter(quiz =>
      quiz.status === 'active' &&
      Array.isArray(quiz.cbus) &&
      quiz.cbus.map(c => c.trim().toLowerCase()).includes(user.cbu!.trim().toLowerCase())
    );
  }

  private buildStats(stats: any): DashboardStats {
    if (!stats) {
      return {
        quizCompleted: 0,
        averageScore: 0,
        ranking: 0,
        totalTime: '0min'
      };
    }

    return {
      quizCompleted: stats.totalQuizzesCompleted || 0,
      averageScore: Math.round(stats.averageScore || 0),
      ranking: stats.ranking || 0,
      totalTime: this.formatTotalTime(stats.totalTimeSpent || 0)
    };
  }

  private buildRecommendedQuizzes(userQuizzes: Quiz[], stats: any): RecommendedQuiz[] {
    const completedQuizIds = stats?.recentResults?.map((r: any) => r.quizId) || [];
    const availableQuizzes = userQuizzes.filter(quiz => !completedQuizIds.includes(quiz.id));
    
    return availableQuizzes.slice(0, 6).map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || 'Quiz interactif pour tester vos connaissances',
      difficulty: this.mapDifficultyLevel((quiz as any).difficulty),
      duration: quiz.duration || 15,
      questions: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questions as any || 10),
      rating: 4.5, // Note par défaut
      progress: completedQuizIds.includes(quiz.id) ? 100 : 0,
      status: completedQuizIds.includes(quiz.id) ? 'Terminé' : 'Non commencé',
      badge: this.getBadgeForQuiz(quiz)
    }));
  }

  private buildLearningPath(userQuizzes: Quiz[], stats: any): LearningPathStep[] {
    const themes = [...new Set(userQuizzes.map(q => q.theme))];
    const completedByTheme = this.getCompletedQuizzesByTheme(stats);
    
    return themes.slice(0, 4).map((theme, index) => {
      const themeQuizzes = userQuizzes.filter(q => q.theme === theme);
      const completed = completedByTheme[theme] || 0;
      const total = themeQuizzes.length;
      
      let status: 'completed' | 'current' | 'locked';
      let statusText: string;
      
      if (completed === total && total > 0) {
        status = 'completed';
        statusText = 'Terminé';
      } else if (index === 0 || completed > 0) {
        status = 'current';
        statusText = `${completed}/${total} terminés`;
      } else {
        status = 'locked';
        statusText = 'Verrouillé';
      }
      
      return {
        step: index + 1,
        title: this.getThemeDisplayName(theme),
        description: `Maîtrisez les concepts de ${theme.toLowerCase()}`,
        status,
        statusText
      };
    });
  }

  private buildAchievements(stats: any): Achievement[] {
    const achievements: Achievement[] = [
      {
        icon: '🏆',
        title: 'Premier Quiz',
        description: 'Terminer votre premier quiz',
        earned: (stats?.totalQuizzesCompleted || 0) >= 1,
        date: stats?.totalQuizzesCompleted >= 1 ? 'Obtenu' : undefined,
        progress: stats?.totalQuizzesCompleted >= 1 ? undefined : '0/1'
      },
      {
        icon: '🌟',
        title: 'Score Parfait',
        description: 'Obtenir 100% à un quiz',
        earned: (stats?.bestScore || 0) >= 100,
        date: stats?.bestScore >= 100 ? 'Obtenu' : undefined,
        progress: stats?.bestScore >= 100 ? undefined : `${stats?.bestScore || 0}/100`
      },
      {
        icon: '📚',
        title: 'Apprenant Assidu',
        description: 'Terminer 10 quiz',
        earned: (stats?.totalQuizzesCompleted || 0) >= 10,
        date: stats?.totalQuizzesCompleted >= 10 ? 'Obtenu' : undefined,
        progress: stats?.totalQuizzesCompleted >= 10 ? undefined : `${stats?.totalQuizzesCompleted || 0}/10`
      },
      {
        icon: '⚡',
        title: 'Rapidité',
        description: 'Terminer un quiz en moins de 5 minutes',
        earned: false,
        progress: 'En cours...'
      }
    ];
    
    return achievements;
  }

  private buildQuickActions(): QuickAction[] {
    return [
      {
        icon: 'brain',
        title: 'Nouveau Quiz',
        description: 'Commencer un nouveau quiz',
        route: '/quizzes'
      },
      {
        icon: 'chart',
        title: 'Mes Statistiques',
        description: 'Voir mes performances',
        route: '/stats'
      },
      {
        icon: 'user',
        title: 'Mon Profil',
        description: 'Gérer mon compte',
        route: '/profile'
      },
      {
        icon: 'settings',
        title: 'Paramètres',
        description: 'Configurer l\'application',
        route: '/settings'
      }
    ];
  }

  private getRecentActivities(): Observable<RecentActivity[]> {
    return this.statsService.stats$.pipe(
      map(stats => {
        if (!stats?.recentResults) return [];
        
        return stats.recentResults.slice(0, 6).map((result: any) => ({
          type: this.getActivityType(result.percentage),
          title: this.getActivityTitle(result),
          description: `Score: ${result.percentage}% - ${result.correctAnswers}/${result.totalQuestions} bonnes réponses`,
          time: this.getTimeAgo(result.completedAt)
        }));
      })
    );
  }

  private getTopPerformers(): Observable<TopPerformer[]> {
    // Simulation de données pour le classement
    return of([
      {
        rank: '🥇',
        name: 'Alice Martin',
        points: '1,250 pts',
        avatar: '/assets/avatars/alice.jpg',
        current: false
      },
      {
        rank: '🥈',
        name: 'Bob Dupont',
        points: '1,180 pts',
        avatar: '/assets/avatars/bob.jpg',
        current: false
      },
      {
        rank: '🥉',
        name: 'Vous',
        points: '950 pts',
        avatar: '/assets/avatars/default.jpg',
        current: true
      }
    ]);
  }

  // Méthodes utilitaires
  private formatTotalTime(seconds: number): string {
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

  private mapDifficultyLevel(difficulty: string | undefined): 'beginner' | 'intermediate' | 'expert' {
    if (!difficulty) return 'intermediate';
    switch (difficulty.toLowerCase()) {
      case 'facile': return 'beginner';
      case 'moyen': return 'intermediate';
      case 'difficile': return 'expert';
      default: return 'intermediate';
    }
  }

  private getBadgeForQuiz(quiz: Quiz): 'new' | 'trending' | 'popular' {
    const createdDate = new Date((quiz as any).createdAt || Date.now());
    const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 7) return 'new';
    if (Math.random() > 0.7) return 'trending';
    return 'popular';
  }

  private getThemeDisplayName(theme: string): string {
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

  private getCompletedQuizzesByTheme(stats: any): { [theme: string]: number } {
    if (!stats?.recentResults) return {};
    
    const byTheme: { [theme: string]: number } = {};
    stats.recentResults.forEach((result: any) => {
      const theme = result.theme || 'general';
      byTheme[theme] = (byTheme[theme] || 0) + 1;
    });
    
    return byTheme;
  }

  private getQuizzesThisWeek(stats: any): number {
    if (!stats?.recentResults) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return stats.recentResults.filter((result: any) => 
      new Date(result.completedAt) >= oneWeekAgo
    ).length;
  }

  private getScoreEvolution(stats: any): number {
    if (!stats?.recentResults || stats.recentResults.length < 2) return 0;
    
    const recent = stats.recentResults.slice(0, 5);
    const older = stats.recentResults.slice(5, 10);
    
    const recentAvg = recent.reduce((sum: number, r: any) => sum + r.percentage, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum: number, r: any) => sum + r.percentage, 0) / older.length : recentAvg;
    
    return Math.round(recentAvg - olderAvg);
  }

  private getRankingTrend(stats: any): string {
    // Simulation de tendance du classement
    const trend = Math.random();
    if (trend > 0.6) return '↗️ +2 places';
    if (trend < 0.4) return '↘️ -1 place';
    return '→ Stable';
  }

  private getTimeSpentThisWeek(stats: any): number {
    if (!stats?.recentResults) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return stats.recentResults
      .filter((result: any) => new Date(result.completedAt) >= oneWeekAgo)
      .reduce((sum: number, result: any) => sum + (result.timeSpent || 0), 0) / 60; // en minutes
  }

  private getActivityType(percentage: number): 'success' | 'info' | 'warning' {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    return 'warning';
  }

  private getActivityTitle(result: any): string {
    if (result.percentage >= 90) return '🌟 Score Excellent';
    if (result.percentage >= 80) return '🏆 Très Bonne Performance';
    if (result.percentage >= 60) return '👍 Bonne Tentative';
    return '💪 Quiz Terminé';
  }

  private getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      stats: {
        quizCompleted: 0,
        averageScore: 0,
        ranking: 0,
        totalTime: '0min'
      },
      recentActivities: [],
      recommendedQuizzes: [],
      learningPath: [],
      topPerformers: [],
      achievements: [],
      quickActions: this.buildQuickActions(),
      quizzesThisWeek: 0,
      scoreEvolution: 0,
      rankingTrend: 'Nouveau',
      timeSpentThisWeek: 0
    };
  }

  refreshDashboard(): Observable<DashboardData> {
    return this.loadDashboardData();
  }
}