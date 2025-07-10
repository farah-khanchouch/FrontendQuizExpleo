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
  earnedBadges: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    const quizId = this.route.snapshot.params['quizId'];
    const score = parseInt(this.route.snapshot.queryParams['score'] || '0');
    this.userScore = score;
    this.loadQuiz(quizId);
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
    this.correctAnswers = Math.floor((this.scorePercentage / 100) * this.quiz.questions.length);
    this.incorrectAnswers = this.quiz.questions.length - this.correctAnswers;

    if (this.scorePercentage >= 80) {
      this.earnedBadges.push({ icon: '🏆', name: 'Excellence', description: 'Score supérieur à 80%' });
    }
    if (this.scorePercentage === 100) {
      this.earnedBadges.push({ icon: '🌟', name: 'Perfection', description: 'Score parfait de 100%' });
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
    if (this.scorePercentage >= 90) return 'Excellente performance !';
    if (this.scorePercentage >= 80) return 'Très bien joué !';
    if (this.scorePercentage >= 70) return 'Bon travail !';
    if (this.scorePercentage >= 60) return 'Pas mal !';
    return 'Continuez vos efforts !';
  }

  getEncouragementMessage(): string {
    if (this.scorePercentage >= 90) return 'Vous maîtrisez parfaitement ce sujet. Félicitations !';
    if (this.scorePercentage >= 80) return 'Excellente maîtrise du sujet. Vous pouvez être fier de vous !';
    if (this.scorePercentage >= 70) return 'Bonne compréhension générale. Quelques révisions et ce sera parfait !';
    if (this.scorePercentage >= 60) return 'Vous avez les bases, il faut maintenant approfondir vos connaissances.';
    return 'Ne vous découragez pas ! Chaque quiz est une occasion d\'apprendre.';
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
}
