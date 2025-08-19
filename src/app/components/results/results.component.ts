import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  quiz: Quiz | null = null;
  userScore = 0;
  scorePercentage = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  totalQuestions = 0;
  earnedBadges: any[] = [];
  timeSpent = 0; // En secondes
  isAnimationComplete = false;

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    const quizId = this.route.snapshot.params['quizId'];
    this.userScore = parseInt(this.route.snapshot.queryParams['score'] || '0');
    this.correctAnswers = parseInt(this.route.snapshot.queryParams['correctAnswers'] || '0');
    this.totalQuestions = parseInt(this.route.snapshot.queryParams['totalQuestions'] || '0');
    this.timeSpent = parseInt(this.route.snapshot.queryParams['time'] || '0');
    this.incorrectAnswers = this.totalQuestions - this.correctAnswers;
    this.scorePercentage = this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;
  
    this.loadQuiz(quizId);
  
    setTimeout(() => {
      this.isAnimationComplete = true;
    }, 1500);
  }

  loadQuiz(quizId: string): void {
    this.quizService.getQuizById(quizId).subscribe((quiz: Quiz | undefined) => {
      if (quiz) {
        this.quiz = quiz;
        this.calculateResults();
      }
    });
  }

  calculateResults(): void {
    if (!this.quiz) return;

    this.scorePercentage = Math.round((this.userScore / this.quiz.points) * 100);
  
    // Calcul des badges
    this.calculateBadges();
  }

  calculateBadges(): void {
    this.earnedBadges = [];
    
    // Badge de performance
    if (this.scorePercentage === 100) {
      this.earnedBadges.push({
        icon: '🌟',
        name: 'Perfectionniste',
        description: 'Score parfait de 100%',
        color: '#FFD700',
        requirement: 'Obtenir 100% au quiz'
      });
    } else if (this.scorePercentage >= 90) {
      this.earnedBadges.push({
        icon: '🏆',
        name: 'Excellence',
        description: 'Performance exceptionnelle',
        color: '#667eea',
        requirement: 'Obtenir plus de 90%'
      });
    } else if (this.scorePercentage >= 80) {
      this.earnedBadges.push({
        icon: '🎉',
        name: 'Très Bien',
        description: 'Très bonne performance',
        color: '#10b981',
        requirement: 'Obtenir plus de 80%'
      });
    } else if (this.scorePercentage >= 70) {
      this.earnedBadges.push({
        icon: '👍',
        name: 'Bien Joué',
        description: 'Bonne performance',
        color: '#3b82f6',
        requirement: 'Obtenir plus de 70%'
      });
    } else {
      this.earnedBadges.push({
        icon: '💪',
        name: 'Persévérant',
        description: 'Continue tes efforts !',
        color: '#f59e0b',
        requirement: 'Terminer le quiz'
      });
    }

    // Badge de rapidité
    const averageTimePerQuestion = this.timeSpent / this.quiz!.questions.length;
    if (averageTimePerQuestion < 30 && this.scorePercentage >= 80) {
      this.earnedBadges.push({
        icon: '⚡',
        name: 'Éclair',
        description: 'Rapidité et précision',
        color: '#f59e0b',
        requirement: 'Finir rapidement avec un bon score'
      });
    }
  }

  getScoreEmoji(): string {
    if (this.scorePercentage >= 90) return '🏆';
    if (this.scorePercentage >= 80) return '🎉';
    if (this.scorePercentage >= 70) return '👍';
    if (this.scorePercentage >= 60) return '💪';
    return '📚';
  }

  getScoreMessage(): string {
    if (this.scorePercentage >= 90) return 'Performance Exceptionnelle !';
    if (this.scorePercentage >= 80) return 'Très Bonne Performance !';
    if (this.scorePercentage >= 70) return 'Bonne Performance !';
    if (this.scorePercentage >= 60) return 'Performance Correcte !';
    return 'Continue tes Efforts !';
  }

  getEncouragementMessage(): string {
    if (this.scorePercentage >= 90) 
      return 'Félicitations ! Tu maîtrises parfaitement ce sujet. Ton excellence est remarquable !';
    if (this.scorePercentage >= 80) 
      return 'Bravo ! Tu as une très bonne compréhension du sujet. Continue comme ça !';
    if (this.scorePercentage >= 70) 
      return 'Bien joué ! Tu as de bonnes bases. Avec un peu plus de révision, tu seras au top !';
    if (this.scorePercentage >= 60) 
      return 'Pas mal ! Tu progresses bien. Quelques révisions et tu auras un excellent score !';
    return 'Ne te décourage pas ! Chaque quiz est une opportunité d\'apprendre. Révise et réessaie !';
  }

  getPerformanceLevel(): string {
    if (this.scorePercentage >= 90) return 'Excellent';
    if (this.scorePercentage >= 80) return 'Très Bien';
    if (this.scorePercentage >= 70) return 'Bien';
    if (this.scorePercentage >= 60) return 'Assez Bien';
    return 'À Améliorer';
  }

  getPerformanceColor(): string {
    if (this.scorePercentage >= 90) return '#10b981';
    if (this.scorePercentage >= 80) return '#3b82f6';
    if (this.scorePercentage >= 70) return '#f59e0b';
    if (this.scorePercentage >= 60) return '#f59e0b';
    return '#ef4444';
  }

  getPercentageGradient(): string {
    if (this.scorePercentage >= 90) return 'linear-gradient(135deg, #10b981, #059669)';
    if (this.scorePercentage >= 80) return 'linear-gradient(135deg, #3b82f6, #2563eb)';
    if (this.scorePercentage >= 70) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (this.scorePercentage >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  getMessageClass(): string {
    if (this.scorePercentage >= 90) return 'excellent';
    if (this.scorePercentage >= 80) return 'good';
    if (this.scorePercentage >= 70) return 'average';
    return 'needs-improvement';
  }

  getMessageIcon(): string {
    if (this.scorePercentage >= 90) return '🏆';
    if (this.scorePercentage >= 80) return '🎉';
    if (this.scorePercentage >= 70) return '👍';
    return '💪';
  }

  getTimeSpent(): string {
    const minutes = Math.floor(this.timeSpent / 60);
    const seconds = this.timeSpent % 60;
    
    if (minutes > 0) {
      return `${minutes} min ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getBadgeGradient(badge: any): string {
    const color = badge.color;
    return `linear-gradient(135deg, ${color}, ${this.darkenColor(color, 20)})`;
  }

  darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  getImprovementTips(): string[] {
    const tips: string[] = [];

    if (this.scorePercentage < 80) {
      tips.push('📖 Prenez le temps de bien lire chaque question avant de répondre');
      tips.push('💡 Consultez les explications après chaque réponse pour mieux comprendre');
    }

    if (this.scorePercentage < 60) {
      tips.push('🧠 Révisez les concepts de base avant de refaire le quiz');
      tips.push('🔍 Faites des recherches complémentaires sur le sujet');
    }

    if (this.quiz?.theme === 'technique') {
      tips.push('💻 Pratiquez régulièrement pour consolider vos connaissances techniques');
    }

    if (this.quiz?.theme === 'culture') {
      tips.push('🏢 Explorez davantage les ressources sur la culture d\'entreprise');
    }

    tips.push('🔁 Refaites le quiz dans quelques jours pour mesurer vos progrès');

    return tips;
  }

  retakeQuiz(): void {
    // Navigation vers le quiz
  }

  goToQuizList(): void {
    // Navigation vers la liste des quiz
  }
}