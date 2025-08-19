import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';


// Modèle User simple (tu peux ajuster)
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  cbu?: string;
  totalPoints?: number;
  joinedAt: string;           // format ISO (ex: '2024-01-01T00:00:00Z')
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  badges: number;
  status: 'active' | 'inactive' | 'blocked';
  lastActivity: string; 
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users'; // 🔁 À adapter selon ton backend

  constructor(private http: HttpClient) {}

  // ✅ Récupérer tous les utilisateurs
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // ✅ Récupérer un utilisateur par ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // ✅ Mettre à jour un utilisateur (statut, données...)
  updateUser(id: string, updatedUser: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, updatedUser);
  }

  // ✅ Supprimer un utilisateur
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ Créer un utilisateur (optionnel)
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
  // user.service.ts
updateAvatar(userId: string, avatar: string) {
  return this.http.patch<User>(`http://localhost:3000/api/users/${userId}`, { avatar });
}
}
