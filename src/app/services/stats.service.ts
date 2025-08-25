import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, catchError, of, finalize, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { QuizService } from './quiz.service';
import { HttpClient } from '@angular/common/http';

export interface QuizResult {
    id?: string;
    userId: string;
    quizId: string;
    quizTitle?: string;
    theme?: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    timeSpent: number;
    completedAt: Date;
    pointsEarned: number;
    attempts?: number;
}

export interface UserStatistics {

    totalQuizzesCompleted: number;
    totalQuizzesAvailable: number;
    globalCompletionRate: number;
    averageScore: number;
    bestScore: number;
    totalTimeSpent: number;
    totalPointsEarned: number;
    themeStats: ThemeStats[];
    weeklyStats: WeeklyStats[];
    recentResults: QuizResult[];
    bestResults: BestResult[];
    performanceMetrics: PerformanceMetrics;
}

export interface ThemeStats {
    theme: string;
    displayName: string;
    quizCount: number;
    totalQuizzes: number;
    bestScore: number;
    averageScore: number;
    completionRate: number;
    totalTimeSpent: number;
    improvement: number;
}

export interface WeeklyStats {
    weekStart: Date;
    weekLabel: string;
    quizCount: number;
    averageScore: number;
    timeSpent: number;
    improvementFromPrevious: number;
}

export interface BestResult {
    theme: string;
    quizId: string;
    quizTitle: string;
    score: number;
    percentage: number;
    date: Date;
    timeSpent: number;
}

export interface PerformanceMetrics {
    consistency: number;
    improvement: number;
    speedAccuracy: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    private readonly API_BASE = 'https://quizonexpleo.up.railway.app/api';

    private statsSubject = new BehaviorSubject<UserStatistics | null>(null);
    public stats$ = this.statsSubject.asObservable();

    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.isLoadingSubject.asObservable();

    private userResults: QuizResult[] = [];
    private availableQuizzes: any[] = [];

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private quizService: QuizService
    ) {
        // Écouter les changements d'authentification si authService a user$
        // Sinon, les composants devront appeler loadUserStatistics() manuellement
    }

    /**
     * Charge les statistiques de l'utilisateur depuis la base de données
     */
    // Dans votre stats.service.ts, modifiez la méthode loadUserStatistics

    public loadUserStatistics(forceReload = false): Observable<UserStatistics> {
        const user = this.authService.getCurrentUser();
        if (!user || !user.id) {
            console.error('Utilisateur non connecté ou ID manquant');
            return of(this.getEmptyStats());
        }

        // Si les données sont déjà chargées et qu'on ne force pas le rechargement
        if (!forceReload && this.userResults.length > 0 && this.statsSubject.value) {
            return of(this.statsSubject.value);
        }

        console.log('Chargement des statistiques pour l\'utilisateur ID:', user.id);
        this.isLoadingSubject.next(true);

        return combineLatest([
            // ✅ CORRECTION : Utilisez user.cbu pour filtrer les quiz disponibles
            this.loadAvailableQuizzes(user.cbu || ''),  // <- CBU pour filtrer les quiz
            // ✅ CORRECTION : Utilisez user.id pour charger les résultats
            this.loadUserResults(user.id)  // <- _ID pour les résultats utilisateur
        ]).pipe(
            map(([availableQuizzes, userResults]) => {
                console.log('Données chargées - Quiz disponibles:', availableQuizzes.length, 'Résultats:', userResults.length);

                // Stocker les données dans les propriétés de classe
                this.availableQuizzes = availableQuizzes;
                this.userResults = userResults;

                // Calculer et retourner les statistiques
                const stats = this.calculateAllStatistics();
                this.statsSubject.next(stats);

                // Sauvegarder localement pour éviter les pertes
                this.saveStatsToLocalStorage(stats);

                return stats;
            }),
            catchError(error => {
                console.error('Erreur lors du chargement des statistiques:', error);

                // Essayer de récupérer depuis le localStorage en cas d'erreur réseau
                const cachedStats = this.getStatsFromLocalStorage();
                if (cachedStats) {
                    console.log('Récupération des statistiques depuis le cache local');
                    this.statsSubject.next(cachedStats);
                    return of(cachedStats);
                }

                const emptyStats = this.getEmptyStats();
                this.statsSubject.next(emptyStats);
                return of(emptyStats);
            }),
            finalize(() => {
                this.isLoadingSubject.next(false);
            })
        );
    }
    /**
     * Ajoute un nouveau résultat de quiz et met à jour les statistiques
     */
    public addQuizResult(result: Partial<QuizResult>): Observable<UserStatistics> {
        const user = this.authService.getCurrentUser();

        // ✅ AJOUTEZ CES LOGS POUR DÉBUGGER
        console.log('🔍 Current user object:', user);
        console.log('🔍 User _id:', user?._id);
        console.log('🔍 User keys:', user ? Object.keys(user) : 'user is null');

        if (!user || !user.id) {
            console.error('❌ Utilisateur non connecté - user:', user);
            throw new Error('Utilisateur non connecté');
        }
        if (!user || !user.id) {
            throw new Error('Utilisateur non connecté');
        }

        const completeResult: Partial<QuizResult> = {
            userId: user.id,
            quizId: result.quizId!,
            score: result.score || 0,
            totalQuestions: result.totalQuestions || 0,
            correctAnswers: result.correctAnswers || 0,
            percentage: result.percentage || Math.round((result.correctAnswers || 0) / (result.totalQuestions || 1) * 100),
            timeSpent: result.timeSpent || 0,
            pointsEarned: result.pointsEarned || result.score || 0,
            attempts: result.attempts || 1,
            completedAt: new Date(),
            quizTitle: result.quizTitle,
            theme: result.theme
        };

        // Enrichir avec les infos du quiz si manquantes
        const quiz = this.availableQuizzes.find(q => q.id === result.quizId);
        if (quiz) {
            completeResult.quizTitle = quiz.title;
            completeResult.theme = quiz.theme;
        }

        console.log('Sauvegarde du résultat:', completeResult);

        return this.http.post<QuizResult>(`${this.API_BASE}/quiz-results`, completeResult).pipe(
            tap(savedResult => {
                console.log('Résultat sauvegardé avec succès:', savedResult);

                // Convertir la date
                savedResult.completedAt = new Date(savedResult.completedAt);

                // Ajouter à la liste locale
                this.userResults.push(savedResult);

                // Recalculer les statistiques
                const updatedStats = this.calculateAllStatistics();
                this.statsSubject.next(updatedStats);

                // Mettre à jour le cache local
                this.saveStatsToLocalStorage(updatedStats);
            }),
            map(() => {
                return this.statsSubject.value!;
            }),
            catchError(error => {
                console.error('Erreur lors de la sauvegarde du résultat:', error);

                // En cas d'erreur, ajouter quand même localement
                const localResult = { ...completeResult, id: Date.now().toString() } as QuizResult;
                this.userResults.push(localResult);

                const updatedStats = this.calculateAllStatistics();
                this.statsSubject.next(updatedStats);
                this.saveStatsToLocalStorage(updatedStats);

                // Marquer ce résultat comme "à synchroniser" plus tard
                this.markForLaterSync(localResult);

                return of(updatedStats);
            })
        );
    }

    /**
     * Charge les quiz disponibles pour l'utilisateur
     */
    private loadAvailableQuizzes(userCbu: string): Observable<any[]> {
        return this.quizService.getQuizzes().pipe(
            map((quizzes: any[]) => {
                const filtered = quizzes.filter((q: any) =>
                    q.status === 'active' &&
                    Array.isArray(q.cbus) &&
                    q.cbus.map((c: string) => c.trim().toLowerCase()).includes(userCbu.trim().toLowerCase())
                );
                console.log(`Quiz filtrés pour ${userCbu}:`, filtered.length);
                return filtered;
            }),
            catchError(error => {
                console.error('Erreur lors du chargement des quiz:', error);
                return of([]);
            })
        );
    }

    /**
     * Charge les résultats de l'utilisateur depuis la base de données
     */
    private loadUserResults(userId: string): Observable<QuizResult[]> {
        console.log('Chargement des résultats pour User ID:', userId);

        const cleanUserId = encodeURIComponent(userId.trim());
        const url = `${this.API_BASE}/quiz-results/${cleanUserId}`;

        return this.http.get<QuizResult[]>(url).pipe(
            map(results => {
                console.log('Résultats reçus du serveur:', results);
                return results.map(r => ({
                    ...r,
                    completedAt: new Date(r.completedAt)
                }));
            }),
            catchError(error => {
                console.error('Erreur lors du chargement des résultats:', error);
                return of([]);
            })
        );
    }

    /**
     * Sauvegarde les statistiques dans le localStorage
     */
    private saveStatsToLocalStorage(stats: UserStatistics): void {
        try {
            const user = this.authService.getCurrentUser();
            if (user && user.id) {
                const cacheKey = `stats_${user.id}`;
                const dataToCache = {
                    stats,
                    userResults: this.userResults,
                    availableQuizzes: this.availableQuizzes,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
                console.log('Statistiques sauvegardées en local pour user ID:', user.id);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde en local:', error);
        }
    }

    /**
     * Récupère les statistiques depuis le localStorage
     */
    private getStatsFromLocalStorage(): UserStatistics | null {
        try {
            const user = this.authService.getCurrentUser();
            if (user && user.id) {
                const cacheKey = `stats_${user.id}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);

                    // Vérifier que les données ne sont pas trop anciennes (24h)
                    const isRecent = (new Date().getTime() - data.timestamp) < 24 * 60 * 60 * 1000;
                    if (isRecent && data.stats) {
                        // Restaurer les données en mémoire
                        this.userResults = data.userResults || [];
                        this.availableQuizzes = data.availableQuizzes || [];

                        // Convertir les dates
                        this.userResults = this.userResults.map(r => ({
                            ...r,
                            completedAt: new Date(r.completedAt)
                        }));

                        return data.stats;
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération depuis le cache local:', error);
        }
        return null;
    }

    /**
     * Vide les statistiques locales
     */
    private clearLocalStats(): void {
        this.userResults = [];
        this.availableQuizzes = [];
        this.statsSubject.next(null);

        // Nettoyer le localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('stats_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Erreur lors du nettoyage du cache local:', error);
        }
    }

    /**
     * Marque un résultat pour synchronisation ultérieure
     */
    private markForLaterSync(result: QuizResult): void {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingResults') || '[]');
            pending.push(result);
            localStorage.setItem('pendingResults', JSON.stringify(pending));
        } catch (error) {
            console.error('Erreur lors du marquage pour sync:', error);
        }
    }

    /**
     * Synchronise les résultats en attente
     */
    public syncPendingResults(): Observable<boolean> {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingResults') || '[]');
            if (pending.length === 0) {
                return of(true);
            }

            const syncRequests = pending.map((result: QuizResult) =>
                this.http.post<QuizResult>(`${this.API_BASE}/quiz-results`, result)
            );

            return combineLatest(syncRequests).pipe(
                tap(() => {
                    // Supprimer les résultats synchronisés
                    localStorage.removeItem('pendingResults');
                    console.log('Synchronisation terminée');
                }),
                map(() => true),
                catchError(error => {
                    console.error('Erreur lors de la synchronisation:', error);
                    return of(false);
                })
            );
        } catch (error) {
            console.error('Erreur lors de la lecture des résultats en attente:', error);
            return of(false);
        }
    }

    /**
     * Force le rechargement des statistiques
     */
    public refreshStats(): Observable<UserStatistics> {
        return this.loadUserStatistics(true);
    }

    // Méthodes publiques pour récupérer les données
    public getCurrentStats(): UserStatistics | null {
        return this.statsSubject.value;
    }

    public getRecentResults(limit: number = 10): QuizResult[] {
        return [...this.userResults]
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .slice(0, limit);
    }

    public getThemeStatistics(theme: string): ThemeStats | null {
        const stats = this.getCurrentStats();
        return stats?.themeStats.find(t => t.theme === theme) || null;
    }

    public getPerformanceComparison(): {
        aboveAverage: string[];
        belowAverage: string[];
        averageGlobal: number;
    } {
        const stats = this.getCurrentStats();
        if (!stats) return { aboveAverage: [], belowAverage: [], averageGlobal: 0 };

        const averageGlobal = stats.averageScore;
        const aboveAverage: string[] = [];
        const belowAverage: string[] = [];

        stats.themeStats.forEach(theme => {
            if (theme.averageScore > averageGlobal) {
                aboveAverage.push(theme.displayName);
            } else if (theme.averageScore < averageGlobal) {
                belowAverage.push(theme.displayName);
            }
        });

        return { aboveAverage, belowAverage, averageGlobal };
    }

    public getProgressionAnalysis(days: number = 30): {
        trend: 'improving' | 'stable' | 'declining';
        scoreEvolution: number;
        speedEvolution: number;
    } {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentResults = this.userResults.filter(r =>
            new Date(r.completedAt) >= cutoffDate
        );

        const olderResults = this.userResults.filter(r =>
            new Date(r.completedAt) < cutoffDate
        );

        if (recentResults.length === 0 || olderResults.length === 0) {
            return { trend: 'stable', scoreEvolution: 0, speedEvolution: 0 };
        }

        const recentAvgScore = recentResults.reduce((sum, r) => sum + r.percentage, 0) / recentResults.length;
        const olderAvgScore = olderResults.reduce((sum, r) => sum + r.percentage, 0) / olderResults.length;

        const scoreEvolution = ((recentAvgScore - olderAvgScore) / olderAvgScore) * 100;

        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (scoreEvolution > 5) trend = 'improving';
        else if (scoreEvolution < -5) trend = 'declining';

        return { trend, scoreEvolution, speedEvolution: 0 };
    }

    // Méthodes privées pour les calculs
    private calculateAllStatistics(): UserStatistics {
        return {
            totalQuizzesCompleted: this.userResults.length,
            totalQuizzesAvailable: this.availableQuizzes.length,
            globalCompletionRate: this.calculateGlobalCompletionRate(),
            averageScore: this.calculateAverageScore(),
            bestScore: this.calculateBestScore(),
            totalTimeSpent: this.calculateTotalTimeSpent(),
            totalPointsEarned: this.calculateTotalPoints(),
            themeStats: this.calculateThemeStatistics(),
            weeklyStats: this.calculateWeeklyStatistics(),
            recentResults: this.getRecentResults(10),
            bestResults: this.calculateBestResults(),
            performanceMetrics: this.calculatePerformanceMetrics()
        };
    }

    private calculateGlobalCompletionRate(): number {
        if (this.availableQuizzes.length === 0) return 0;
        const uniqueQuizzes = new Set(this.userResults.map(r => r.quizId));
        return Math.round((uniqueQuizzes.size / this.availableQuizzes.length) * 100);
    }

    private calculateAverageScore(): number {
        if (this.userResults.length === 0) return 0;
        const sum = this.userResults.reduce((total, result) => total + result.percentage, 0);
        return Math.round(sum / this.userResults.length);
    }

    private calculateBestScore(): number {
        if (this.userResults.length === 0) return 0;
        return Math.max(...this.userResults.map(r => r.percentage));
    }

    private calculateTotalTimeSpent(): number {
        return this.userResults.reduce((total, result) => total + result.timeSpent, 0);
    }

    private calculateTotalPoints(): number {
        return this.userResults.reduce((total, result) => total + result.pointsEarned, 0);
    }

    private calculateThemeStatistics(): ThemeStats[] {
        const themes = [...new Set(this.availableQuizzes.map(q => q.theme))];

        return themes.map(theme => {
            const themeQuizzes = this.availableQuizzes.filter(q => q.theme === theme);
            const themeResults = this.userResults.filter(r => r.theme === theme);

            const averageScore = themeResults.length > 0
                ? Math.round(themeResults.reduce((sum, r) => sum + r.percentage, 0) / themeResults.length)
                : 0;

            const bestScore = themeResults.length > 0
                ? Math.max(...themeResults.map(r => r.percentage))
                : 0;

            const completionRate = themeQuizzes.length > 0
                ? Math.round((new Set(themeResults.map(r => r.quizId)).size / themeQuizzes.length) * 100)
                : 0;

            return {
                theme,
                displayName: this.getThemeDisplayName(theme),
                quizCount: themeResults.length,
                totalQuizzes: themeQuizzes.length,
                bestScore,
                averageScore,
                completionRate,
                totalTimeSpent: themeResults.reduce((sum, r) => sum + r.timeSpent, 0),
                improvement: 0
            };
        });
    }

    private calculateWeeklyStatistics(): WeeklyStats[] {
        return []; // Implémentation simplifiée pour l'instant
    }

    private calculateBestResults(): BestResult[] {
        const themeBests: Map<string, QuizResult> = new Map();

        this.userResults.forEach(result => {
            const existing = themeBests.get(result.theme || 'general');
            if (!existing || result.percentage > existing.percentage) {
                themeBests.set(result.theme || 'general', result);
            }
        });

        return Array.from(themeBests.values())
            .map(result => ({
                theme: result.theme || 'general',
                quizId: result.quizId,
                quizTitle: result.quizTitle || 'Quiz inconnu',
                score: result.score,
                percentage: result.percentage,
                date: new Date(result.completedAt),
                timeSpent: result.timeSpent
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);
    }

    private calculatePerformanceMetrics(): PerformanceMetrics {
        if (this.userResults.length === 0) {
            return {
                consistency: 0,
                improvement: 0,
                speedAccuracy: 0,
                strengths: [],
                weaknesses: [],
                recommendations: []
            };
        }

        return {
            consistency: 80,
            improvement: 0,
            speedAccuracy: 75,
            strengths: [],
            weaknesses: [],
            recommendations: ['Continuez vos efforts pour améliorer vos performances']
        };
    }

    private getEmptyStats(): UserStatistics {
        return {
            totalQuizzesCompleted: 0,
            totalQuizzesAvailable: 0,
            globalCompletionRate: 0,
            averageScore: 0,
            bestScore: 0,
            totalTimeSpent: 0,
            totalPointsEarned: 0,
            themeStats: [],
            weeklyStats: [],
            recentResults: [],
            bestResults: [],
            performanceMetrics: {
                consistency: 0,
                improvement: 0,
                speedAccuracy: 0,
                strengths: [],
                weaknesses: [],
                recommendations: []
            }
        };
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

    // Méthode de debug pour nettoyer les données
    public clearAllResults(): Observable<any> {
        const user = this.authService.getCurrentUser();
        if (!user || !user.id) return of(null);

        return this.http.delete(`${this.API_BASE}/quiz-results/user/${user.id}`);
    }
}