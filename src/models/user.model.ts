// src/app/models/user.model.ts

export interface User {
    _id: string;
    username: string;
    email: string;
    cbu: string;
    role: 'admin' | 'collaborator';
    avatar?: string; // facultatif si tu veux gérer une image plus tard
    totalPoints: number;
    badges: Badge[];
    completedQuizzes: string[];
  }
  export interface Badge {
    icon: string;
    name: string;
    description: string;
  }
  