export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  totalPoints: number;
  badges: Badge[];
  completedQuizzes: string[];
}


export interface Quiz {
  id: string;
  title: string;
  description: string;
  theme: 'technique' | 'culture' | 'ludique';
  difficulty: 'facile' | 'moyen' | 'difficile';
  questions: Question[];
  duration: number; // en minutes
  points: number;
  imageUrl?: string;
  badge?: string;
  badgeClass?: string;
  status?: 'completed' | 'not-started';
}

export interface Question {
  id: string;
  question: string;
  type: 'qcm' | 'vrai-faux' | 'libre';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface QuizResult {
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  completedAt: Date;
  badges: Badge[];
}