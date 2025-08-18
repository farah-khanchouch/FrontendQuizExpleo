export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  totalPoints: number;
  badges: Badge[];
  completedQuizzes: string[];
  cbu?: string;
}


export interface Quiz {
  id: string;
  _id: string;
  title: string;
  description: string;
  theme: 'technique' | 'culture' | 'ludique';
  questions: Question[];
  questionCount: number;
  duration: number; // en minutes
  points: number;
  imageUrl?: string;
  badge?: string;
  badgeClass?: string;
  createdAt?: Date;
  participants?: number;
  averageScore?: number;
  cbus: string[];
  status: 'draft' | 'active' | 'archived'; // État général du quiz (admin)
  progressStatus?: 'not-started' | 'in-progress' | 'completed'; // État pour un utilisateur
  userStatus?: 'not-started' | 'in-progress' | 'completed'; // État utilisateur
  

 }

export interface Question {
  id?: string;
  question: string;
  type: 'qcm' | 'vrai-faux' | 'libre';
  options?: string[];
  correctAnswer: string | string[]| number;
  explanation?: string;
  points: number;
  quizId?: string;
}
export interface BadgeCreateDto {
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  type: 'achievement' | 'milestone' | 'special';
}
export interface BadgeUpdateDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  criteria?: string;
  isActive?: boolean;
  type?: 'achievement' | 'milestone' | 'special';
}

export interface Badge {
  id: string;
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  isActive: boolean;
  createdAt: string | Date;
  earnedBy: number;
  type: 'achievement' | 'milestone' | 'special';
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