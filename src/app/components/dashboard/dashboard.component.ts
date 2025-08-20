import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quiz.service';
import { User } from '../../../models/user.model'; // ✅ car tu utilises badges, points
import { Quiz } from '../../../models/quiz.model';
import { DashboardService, UserStats } from '../../services/dashboard.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  availableQuizzes: Quiz[] = [];
  quizzesThisWeek = 0;
  scoreEvolution = 0;
  rankingTrend = 'Stable'; // or '↑', '↓'
  timeSpentThisWeek = 0;
  stats: UserStats = {
    
    quizCompleted: 0,
    averageScore: 0,
    ranking: 0,
    totalTime: ''
  };

  constructor(
    private authService: AuthService,
    private quizService: QuizService,
    private dashboardService: DashboardService,
    
    
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    this.quizService.getQuizzes().subscribe((quizzes: Quiz[]) => {
      this.availableQuizzes = quizzes;
    });
    this.getUserStats();
    
  }
  getUserStats() {
    this.dashboardService.getUserStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => { 
        console.error('Erreur récupération stats : ', err);
      }
    });
  }
  

  calculateAverageScore(): number {
    return Math.floor(Math.random() * 40) + 60;
  }

  getRecommendedQuizzes(): Quiz[] {
    return this.availableQuizzes.slice(0, 3);
  }
 
  
recentActivities = [
  {
    type: 'success',
    title: 'Quiz JavaScript terminé',
    description: 'Bravo ! Vous avez obtenu 90% de réussite.',
    time: 'il y a 2 heures'
  },
  {
    type: 'info',
    title: 'Nouveau badge débloqué',
    description: '🏅 Expert en HTML',
    time: 'il y a 1 jour'
  },
  {
    type: 'warning',
    title: 'Tentative de quiz annulée',
    description: 'Vous avez quitté le quiz CSS avant la fin.',
    time: 'il y a 3 jours'
  }
];

  getThemeIcon(theme: string): string {
    const icons = {
      'technique': '💻',
      'culture': '🏢',
      'ludique': '🎉'
    };
    return icons[theme as keyof typeof icons] || '📚';
  }
  recommendedQuizzes = [
    {
      title: 'Quiz Angular',
      description: 'Testez vos connaissances sur Angular.',
      duration: 15,
      questions: 10,
      rating: 4.5,
      progress: 0,
      badge: 'new',
      difficulty: 'intermediate',
      status: 'Non démarré'
    },
    {
      title: 'Quiz TypeScript',
      description: 'Mettez vos compétences en TypeScript à l’épreuve.',
      duration: 20,
      questions: 12,
      rating: 4.7,
      progress: 50,
      badge: 'trending',
      difficulty: 'expert',
      status: 'En cours'
    },
    {
      title: 'Quiz HTML/CSS',
      description: 'Parfait pour les débutants !',
      duration: 10,
      questions: 8,
      rating: 4.2,
      progress: 100,
      badge: 'popular',
      difficulty: 'beginner',
      status: 'Terminé'
    }
  ];
    // Parcours d'apprentissage
    learningPath = [
      {
        step: 1,
        title: 'Introduction',
        description: 'Commencez par les bases.',
        status: 'completed',
        statusText: 'Terminé'
      },
      {
        step: 2,
        title: 'Fondamentaux',
        description: 'Renforcez vos connaissances.',
        status: 'in-progress',
        statusText: 'En cours'
      },
      {
        step: 3,
        title: 'Projets Avancés',
        description: 'Appliquez vos compétences.',
        status: 'locked',
        statusText: 'Verrouillé'
      }
    ];
  
    // Classement des meilleurs membres de l'équipe
    topPerformers = [
      {
        rank: '🥇',
        name: 'Amine El Majd',
        avatar: 'assets/img/avatars/1.png',
        points: '1250 pts',
        current: true
      },
      {
        rank: '🥈',
        name: 'Lina Touhami',
        avatar: 'assets/img/avatars/2.png',
        points: '1170 pts',
        current: false
      },
      {
        rank: '🥉',
        name: 'Karim Bennani',
        avatar: 'assets/img/avatars/3.png',
        points: '1100 pts',
        current: false
      }
    ];
  
    // Accomplissements (badges)
    achievements = [
      {
        icon: '🏆',
        title: 'Premier Quiz',
        description: 'Vous avez terminé votre premier quiz.',
        earned: true,
        date: '15 Juillet 2025'
      },
      {
        icon: '📚',
        title: '5 Quiz Complétés',
        description: 'Continuez comme ça !',
        earned: false,
        progress: '3/5'
      },
      {
        icon: '🔥',
        title: 'Connexion Quotidienne',
        description: '3 jours d’affilée !',
        earned: true,
        date: '14 Juillet 2025'
      }
    ];
  
    // Actions rapides
    quickActions = [
      {
        icon: 'brain',
        title: 'Nouveau Quiz',
        description: 'Testez vos nouvelles compétences.'
      },
      {
        icon: 'chart',
        title: 'Statistiques',
        description: 'Analysez votre progression.'
      },
      {
        icon: 'user',
        title: 'Profil',
        description: 'Gérez votre compte.'
      },
      {
        icon: 'settings',
        title: 'Paramètres',
        description: 'Personnalisez votre expérience.'
      }
    ];
  
  
}
