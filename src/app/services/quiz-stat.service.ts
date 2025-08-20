import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StatsService, QuizResult } from './stats.service';
import { QuizService } from './quiz.service';
import { AuthService } from './auth.service';

export interface QuizCompletionData {
    quizId: string;
    answers: any[];
    timeSpent: number;
    startTime: Date;
    endTime: Date;
}

export interface ProcessedQuizResult {
    result: QuizResult;
    achievements: Achievement[];
    recommendations: string[];
    nextSuggestions: QuizSuggestion[];
}

export interface Achievement {
    id: string;
    type: 'score' | 'speed' | 'consistency' | 'streak' | 'improvement';
    title: string;
    description: string;
    icon: string;
    color: string;
    points: number;
    isNew: boolean;
}

export interface QuizSuggestion {
    quizId: string;
    title: string;
    theme: string;
    reason: 'weakness' | 'improvement' | 'related' | 'random';
    priority: number;
}

@Injectable({
    providedIn: 'root'
})
export class QuizIntegrationService {

    constructor(
        private statsService: StatsService,
        private quizService: QuizService,
        private authService: AuthService
    ) { }

    /**
     * Traite la completion d'un quiz et met à jour toutes les statistiques
     */
    processQuizCompletion(completionData: QuizCompletionData): Observable<ProcessedQuizResult> {

        return this.quizService.getQuizById(completionData.quizId).pipe(
            switchMap(quiz => {
                if (!quiz) {
                    throw new Error('Quiz non trouvé');
                }
                const result = this.calculateQuizResult(quiz, completionData);
                return this.statsService.addQuizResult(result).pipe(
                    switchMap(updatedStats =>
                        this.generateQuizSuggestions(result, updatedStats).pipe(
                            map(nextSuggestions => {
                                const achievements = this.analyzeAchievements(result, updatedStats);
                                const recommendations = this.generateRecommendations(result, updatedStats);
                                return {
                                    result,
                                    achievements,
                                    recommendations,
                                    nextSuggestions
                                };
                            })
                        )
                    )
                );
            }),
            catchError(error => {
                console.error('Erreur lors du traitement du quiz:', error);
                throw error;
            })
        );
    }

    /**
     * Calcule le résultat d'un quiz basé sur les réponses
     */

    private calculateQuizResult(quiz: any, completionData: QuizCompletionData): QuizResult {
        const user = this.authService.getCurrentUser();
        if (!user) throw new Error('Utilisateur non connecté');
        let correctAnswers = 0;
        let totalPoints = 0;

        completionData.answers.forEach((answer, index) => {
            const question = quiz.questions[index];
            if (question && this.isAnswerCorrect(question, answer)) {
                correctAnswers++;
                totalPoints += question.points || 1;
            }
        });

        const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);

        return {
            userId: user._id || user.cbu || '', // Jamais undefined
            quizId: completionData.quizId,
            quizTitle: quiz.title,
            theme: quiz.theme,
            score: totalPoints,
            totalQuestions: quiz.questions.length,
            correctAnswers,
            percentage,
            timeSpent: completionData.timeSpent,
            completedAt: new Date(completionData.endTime),
            pointsEarned: totalPoints,
            // Ajoute d'autres champs si besoin
        };
    }
    /**
     * Vérifie si une réponse est correcte
     */
    private isAnswerCorrect(question: any, answer: any): boolean {
        switch (question.type) {
            case 'multiple-choice':
                return question.correctAnswer === answer.selectedOption;

            case 'true-false':
                return question.correctAnswer === answer.isTrue;

            case 'text':
                const correctText = question.correctAnswer.toLowerCase().trim();
                const userText = answer.text.toLowerCase().trim();
                return correctText === userText;

            case 'multiple-select':
                const correctAnswers = question.correctAnswers || [];
                const userAnswers = answer.selectedOptions || [];
                return this.arraysEqual(correctAnswers.sort(), userAnswers.sort());

            default:
                console.warn('Type de question non supporté:', question.type);
                return false;
        }
    }

    private arraysEqual(arr1: any[], arr2: any[]): boolean {
        return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
    }

    /**
     * Analyse les performances pour déterminer les achievements
     */
    private analyzeAchievements(result: Partial<QuizResult>, stats: any): Achievement[] {
        const achievements: Achievement[] = [];
        const percentage = result.percentage || 0;
        const timeSpent = result.timeSpent || 0;

        // Achievement de score
        if (percentage === 100) {
            achievements.push({
                id: 'perfect_score',
                type: 'score',
                title: 'Score Parfait',
                description: 'Vous avez obtenu 100% !',
                icon: '🌟',
                color: '#FFD700',
                points: 50,
                isNew: !this.hasAchievement('perfect_score', stats)
            });
        } else if (percentage >= 90) {
            achievements.push({
                id: 'excellent_score',
                type: 'score',
                title: 'Excellence',
                description: 'Score supérieur à 90%',
                icon: '🏆',
                color: '#10b981',
                points: 25,
                isNew: !this.hasAchievement('excellent_score', stats)
            });
        }

        // Achievement de vitesse
        const avgTimePerQuestion = timeSpent / (result.totalQuestions || 1);
        if (avgTimePerQuestion < 20 && percentage >= 80) {
            achievements.push({
                id: 'speed_demon',
                type: 'speed',
                title: 'Éclair',
                description: 'Rapide ET précis !',
                icon: '⚡',
                color: '#f59e0b',
                points: 30,
                isNew: true
            });
        }

        // Achievement de régularité
        if (this.isConsistentPerformer(stats)) {
            achievements.push({
                id: 'consistent',
                type: 'consistency',
                title: 'Régulier',
                description: 'Performances constantes',
                icon: '📊',
                color: '#3b82f6',
                points: 20,
                isNew: !this.hasAchievement('consistent', stats)
            });
        }

        // Achievement de série
        const streak = this.calculateStreak(stats);
        if (streak >= 7) {
            achievements.push({
                id: 'week_streak',
                type: 'streak',
                title: 'Série de 7 jours',
                description: 'Une semaine d\'activité !',
                icon: '🔥',
                color: '#ef4444',
                points: 40,
                isNew: streak === 7
            });
        }

        // Achievement d'amélioration
        const improvement = stats.performanceMetrics?.improvement || 0;
        if (improvement > 20) {
            achievements.push({
                id: 'great_improvement',
                type: 'improvement',
                title: 'Progression Remarquable',
                description: `+${improvement.toFixed(1)}% d'amélioration`,
                icon: '📈',
                color: '#10b981',
                points: 35,
                isNew: true
            });
        }

        return achievements;
    }

    /**
     * Génère des recommandations personnalisées
     */
    private generateRecommendations(result: Partial<QuizResult>, stats: any): string[] {
        const recommendations: string[] = [];
        const percentage = result.percentage || 0;
        const weaknesses = stats.performanceMetrics?.weaknesses || [];

        // Recommandations basées sur la performance
        if (percentage < 60) {
            recommendations.push('Prenez le temps de réviser les concepts de base avant le prochain quiz');
            recommendations.push('Consultez les explications des questions manquées');
        } else if (percentage < 80) {
            recommendations.push('Bonne progression ! Concentrez-vous sur les détails pour améliorer votre score');
        } else if (percentage >= 90) {
            recommendations.push('Excellent travail ! Vous pouvez aborder des sujets plus avancés');
        }

        // Recommandations basées sur les faiblesses
        if (weaknesses.length > 0) {
            recommendations.push(`Renforcez vos connaissances en ${weaknesses[0]} pour un développement équilibré`);
        }

        // Recommandations basées sur le temps
        const avgTime = (result.timeSpent || 0) / (result.totalQuestions || 1);
        if (avgTime > 60) {
            recommendations.push('Essayez de répondre plus rapidement en vous fiant à vos premières intuitions');
        } else if (avgTime < 15 && percentage < 80) {
            recommendations.push('Prenez plus de temps pour bien lire et comprendre chaque question');
        }

        // Recommandations motivationnelles
        if (stats.totalQuizzesCompleted % 10 === 0) {
            recommendations.push('Félicitations pour votre assiduité ! Continuez sur cette lancée');
        }

        return recommendations.slice(0, 3); // Limiter à 3 recommandations
    }

    /**
     * Génère des suggestions de quiz suivants
     */
    private generateQuizSuggestions(result: Partial<QuizResult>, stats: any): Observable<QuizSuggestion[]> {
        return this.quizService.getQuizzes().pipe(
            map(allQuizzes => {
                const user = this.authService.getCurrentUser();
                if (!user) return [];

                // Filtrer les quiz disponibles pour l'utilisateur
                const availableQuizzes = allQuizzes.filter(q =>
                    q.status === 'active' &&
                    q.cbus?.includes(user.cbu) &&
                    q.id !== result.quizId // Exclure le quiz actuel
                );

                const suggestions: QuizSuggestion[] = [];
                const completedQuizIds = new Set(stats.recentResults?.map((r: any) => r.quizId) || []);
                const weaknesses = stats.performanceMetrics?.weaknesses || [];

                // Suggérer des quiz pour les faiblesses
                if (weaknesses.length > 0) {
                    const weaknessQuizzes = availableQuizzes
                        .filter(q => weaknesses.includes(q.theme) && !completedQuizIds.has(q.id))
                        .slice(0, 2);

                    weaknessQuizzes.forEach(quiz => {
                        suggestions.push({
                            quizId: quiz.id,
                            title: quiz.title,
                            theme: quiz.theme,
                            reason: 'weakness',
                            priority: 1
                        });
                    });
                }

                // Suggérer des quiz du même thème si bonne performance
                if ((result.percentage || 0) >= 80) {
                    const sameThemeQuizzes = availableQuizzes
                        .filter(q => q.theme === result.theme && !completedQuizIds.has(q.id))
                        .slice(0, 2);

                    sameThemeQuizzes.forEach(quiz => {
                        suggestions.push({
                            quizId: quiz.id,
                            title: quiz.title,
                            theme: quiz.theme,
                            reason: 'related',
                            priority: 2
                        });
                    });
                }

                // Suggérer des quiz non complétés
                const uncompletedQuizzes = availableQuizzes
                    .filter(q => !completedQuizIds.has(q.id))
                    .sort(() => Math.random() - 0.5) // Randomiser
                    .slice(0, 2);

                uncompletedQuizzes.forEach(quiz => {
                    if (!suggestions.find(s => s.quizId === quiz.id)) {
                        suggestions.push({
                            quizId: quiz.id,
                            title: quiz.title,
                            theme: quiz.theme,
                            reason: 'random',
                            priority: 3
                        });
                    }
                });

                return suggestions
                    .sort((a, b) => a.priority - b.priority)
                    .slice(0, 4); // Limiter à 4 suggestions
            })
        );
    }

    /**
     * Méthodes utilitaires privées
     */
    private hasAchievement(achievementId: string, stats: any): boolean {
        // Dans un vrai système, vous devriez vérifier une base de données d'achievements
        // Pour l'instant, on considère que c'est nouveau si pas dans les stats
        return false;
    }

    private isConsistentPerformer(stats: any): boolean {
        const consistency = stats.performanceMetrics?.consistency || 0;
        return consistency >= 80;
    }

    private calculateStreak(stats: any): number {
        // Calculer la série de jours consécutifs avec activité
        const results = stats.recentResults || [];
        if (results.length === 0) return 0;

        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        for (let i = 0; i < 30; i++) { // Vérifier les 30 derniers jours max
            const dayResults = results.filter((result: any) => {
                const resultDate = new Date(result.completedAt);
                return resultDate.toDateString() === currentDate.toDateString();
            });

            if (dayResults.length === 0) {
                break;
            }

            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    /**
     * Méthodes publiques pour l'intégration avec d'autres composants
     */
    public getQuizSuggestionsForUser(): Observable<QuizSuggestion[]> {
        const stats = this.statsService.getCurrentStats();
        if (!stats) return of([]);

        const mockResult = { quizId: '', percentage: stats.averageScore };
        return this.generateQuizSuggestions(mockResult, stats);
    }

    public getAchievementProgress(): Observable<{
        currentLevel: number,
        nextLevel: number,
        progressToNext: number,
        totalPoints: number
    }> {
        const stats = this.statsService.getCurrentStats();
        if (!stats) {
            return of({ currentLevel: 1, nextLevel: 2, progressToNext: 0, totalPoints: 0 });
        }

        // Système de niveaux basé sur les points
        const totalPoints = stats.totalPointsEarned;
        const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000];

        let currentLevel = 1;
        for (let i = 0; i < levels.length; i++) {
            if (totalPoints >= levels[i]) {
                currentLevel = i + 1;
            } else {
                break;
            }
        }

        const nextLevel = Math.min(currentLevel + 1, levels.length);
        const pointsForNext = levels[nextLevel - 1] || levels[levels.length - 1];
        const pointsForCurrent = levels[currentLevel - 1] || 0;
        const progressToNext = Math.round(((totalPoints - pointsForCurrent) / (pointsForNext - pointsForCurrent)) * 100);

        return of({
            currentLevel,
            nextLevel,
            progressToNext: Math.min(progressToNext, 100),
            totalPoints
        });
    }
}