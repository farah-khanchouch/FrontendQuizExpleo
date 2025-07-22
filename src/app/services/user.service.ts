import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Modèle User simple (tu peux ajuster)
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  cbu?: string;
  totalPoints?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // Données fictives en mémoire
  private users: User[] = [
    {
      id: '123',
      username: 'Farah Farah',
      email: 'farah@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      cbu: 'Marketing',
      totalPoints: 2500
    },
    {
      id: '456',
      username: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=5',
      cbu: 'Développement',
      totalPoints: 1800
    }
  ];

  constructor() {}

  // Récupérer un utilisateur par ID (simulate HTTP)
  getUserById(id: string): Observable<User | null> {
    const user = this.users.find(u => u.id === id) || null;
    // Simule un délai réseau de 500ms
    return of(user).pipe(delay(500));
  }

  // Met à jour un utilisateur (simulate HTTP)
  updateUser(id: string, updatedUser: User): Observable<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...updatedUser, id };
      return of(this.users[index]).pipe(delay(500));
    }
    return of(null).pipe(delay(500));
  }
}
