import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Quiz, Question, QuizResult, Badge } from '../../models/quiz.model';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})

export class QuizService {
  
  constructor(private http: HttpClient) {}

  
  private quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Fondamentaux Angular',
      description: 'Testez vos connaissances sur les concepts de base d\'Angular',
      theme: 'technique',
      difficulty: 'moyen',
      duration: 15,
      points: 100,
      imageUrl: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=300',
      questions: [
        {
          id: '1',
          question: 'Quel est le rôle principal d\'un composant Angular ?',
          type: 'qcm',
          options: [
            'Gérer la logique métier',
            'Contrôler l\'affichage et l\'interaction utilisateur',
            'Stocker les données',
            'Gérer les routes'
          ],
          correctAnswer: 'Contrôler l\'affichage et l\'interaction utilisateur',
          explanation: 'Un composant Angular contrôle une partie de l\'écran appelée vue.',
          points: 25
        },
        {
          id: '2',
          question: 'Angular est-il un framework JavaScript ?',
          type: 'vrai-faux',
          options: ['Vrai', 'Faux'],
          correctAnswer: 'Vrai',
          explanation: 'Angular est effectivement un framework JavaScript développé par Google.',
          points: 25
        },
        {
          id: '3',
          question: 'Quelle commande permet de créer un nouveau composant ?',
          type: 'qcm',
          options: [
            'ng create component',
            'ng generate component',
            'ng new component',
            'ng add component'
          ],
          correctAnswer: 'ng generate component',
          explanation: 'La commande ng generate component (ou ng g c) crée un nouveau composant.',
          points: 25
        },
        {
          id: '4',
          question: 'Les services Angular sont-ils des singletons par défaut ?',
          type: 'vrai-faux',
          options: ['Vrai', 'Faux'],
          correctAnswer: 'Vrai',
          explanation: 'Les services Angular sont des singletons par défaut quand ils sont fournis dans le root.',
          points: 25
        }
      ]
    },
    {
      id: '2',
      title: 'Culture Expleo',
      description: 'Découvrez les valeurs et l\'histoire de notre entreprise',
      theme: 'culture',
      difficulty: 'facile',
      duration: 10,
      points: 75,
      imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300',
      questions: [
        {
          id: '1',
          question: 'En quelle année Expleo a-t-elle été fondée ?',
          type: 'qcm',
          options: ['2019', '2020', '2018', '2021'],
          correctAnswer: '2019',
          explanation: 'Expleo a été créée en 2019 suite à la fusion d\'Assystem et de SQS.',
          points: 25
        },
        {
          id: '2',
          question: 'Expleo est-elle présente dans plus de 20 pays ?',
          type: 'vrai-faux',
          options: ['Vrai', 'Faux'],
          correctAnswer: 'Vrai',
          explanation: 'Expleo est présente dans plus de 30 pays à travers le monde.',
          points: 25
        },
        {
          id: '3',
          question: 'Quel est le slogan d\'Expleo ?',
          type: 'qcm',
          options: [
            'Engineering Excellence',
            'Trusted Technology Partner',
            'Innovation in Motion',
            'Beyond Engineering'
          ],
          correctAnswer: 'Trusted Technology Partner',
          explanation: 'Le slogan d\'Expleo est "Trusted Technology Partner".',
          points: 25
        }
      ]
    },
    {
      id: '3',
      title: 'Quiz Fun - Général',
      description: 'Un quiz amusant pour tester votre culture générale',
      theme: 'ludique',
      difficulty: 'facile',
      duration: 12,
      points: 80,
      imageUrl: 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=300',
      questions: [
        {
          id: '1',
          question: 'Quel est le plus grand océan du monde ?',
          type: 'qcm',
          options: ['Océan Atlantique', 'Océan Pacifique', 'Océan Indien', 'Océan Arctique'],
          correctAnswer: 'Océan Pacifique',
          explanation: 'L\'océan Pacifique couvre environ un tiers de la surface de la Terre.',
          points: 20
        },
        {
          id: '2',
          question: 'Paris est-elle la capitale de la France ?',
          type: 'vrai-faux',
          options: ['Vrai', 'Faux'],
          correctAnswer: 'Vrai',
          explanation: 'Paris est effectivement la capitale de la France.',
          points: 20
        },
        {
          id: '3',
          question: 'Combien y a-t-il de continents ?',
          type: 'qcm',
          options: ['5', '6', '7', '8'],
          correctAnswer: '7',
          explanation: 'Il y a 7 continents : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie.',
          points: 20
        },
        {
          id: '4',
          question: 'Le soleil est-il une étoile ?',
          type: 'vrai-faux',
          options: ['Vrai', 'Faux'],
          correctAnswer: 'Vrai',
          explanation: 'Le soleil est effectivement une étoile, plus précisément une naine jaune.',
          points: 20
        }
      ]
    }
  ];

  private badges: Badge[] = [
    { id: '1', name: 'Premier Quiz', description: 'Félicitations pour votre premier quiz !', icon: '🎉', earnedAt: new Date() },
    { id: '2', name: 'Expert Technique', description: 'Maîtrise parfaite des concepts techniques', icon: '⚡', earnedAt: new Date() },
    { id: '3', name: 'Ambassadeur Culture', description: 'Excellente connaissance de la culture Expleo', icon: '🏆', earnedAt: new Date() },
    { id: '4', name: 'Quiz Master', description: 'Réussite de 5 quiz avec plus de 80%', icon: '🌟', earnedAt: new Date() }
  ];

  getQuizzes(): Observable<Quiz[]> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.quizzes);
        observer.complete();
      }, 500);
    });
  }

  getQuizById(id: string): Observable<Quiz | undefined> {
    return new Observable(observer => {
      setTimeout(() => {
        const quiz = this.quizzes.find(q => q.id === id);
        observer.next(quiz);
        observer.complete();
      }, 300);
    });
  }

  submitQuizResult(quizId: string, answers: { [questionId: string]: string }): Observable<QuizResult> {
    return new Observable(observer => {
      setTimeout(() => {
        const quiz = this.quizzes.find(q => q.id === quizId);
        if (quiz) {
          let correctAnswers = 0;
          let pointsEarned = 0;

          quiz.questions.forEach(question => {
            const userAnswer = answers[question.id];
            if (userAnswer === question.correctAnswer) {
              correctAnswers++;
              pointsEarned += question.points;
            }
          });

          const score = Math.round((correctAnswers / quiz.questions.length) * 100);
          const earnedBadges: Badge[] = [];

          // Attribution des badges selon la performance
          if (score >= 80) {
            earnedBadges.push(this.badges[1]); // Expert
          }
          if (score === 100) {
            earnedBadges.push(this.badges[3]); // Quiz Master
          }

          const result: QuizResult = {
            userId: '1',
            quizId: quizId,
            score: score,
            totalQuestions: quiz.questions.length,
            correctAnswers: correctAnswers,
            pointsEarned: pointsEarned,
            completedAt: new Date(),
            badges: earnedBadges
          };

          observer.next(result);
        }
        observer.complete();
      }, 1000);
    });
  }

  getQuizzesByTheme(theme: string): Observable<Quiz[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const filteredQuizzes = this.quizzes.filter(quiz => quiz.theme === theme);
        observer.next(filteredQuizzes);
        observer.complete();
      }, 300);
    });
  }
  finishQuiz(score: number, timeSpent: number): Observable<any> {
    const body = { score, timeSpent };
    return this.http.post('/api/quiz/finish', body);
  }
  
}