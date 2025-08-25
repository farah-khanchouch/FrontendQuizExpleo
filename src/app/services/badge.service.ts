import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Badge, BadgeCreateDto, BadgeUpdateDto } from '../../models/quiz.model';


@Injectable({
  providedIn: 'root'
})
export class BadgeService {

  private apiUrl = 'https://quizonexpleo.up.railway.app/api/badges'; // 🔁 change l'URL si besoin

  constructor(private http: HttpClient) { }

  // 🔹 Obtenir tous les badges
  getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(this.apiUrl);
  }

  // 🔹 Obtenir un badge par ID
  getBadgeById(id: string): Observable<Badge> {
    return this.http.get<Badge>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Créer un badge
  createBadge(badge: Partial<Badge>): Observable<Badge> {
    return this.http.post<Badge>(this.apiUrl, badge);
  }

  // 🔹 Mettre à jour un badge
  updateBadge(id: string, badge: Partial<Badge>): Observable<Badge> {
    return this.http.put<Badge>(`${this.apiUrl}/${id}`, badge);
  }


  // 🔹 Supprimer un badge
  deleteBadge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Activer/désactiver un badge
  toggleBadgeActivation(id: string, isActive: boolean): Observable<Badge> {
    return this.http.patch<Badge>(`${this.apiUrl}/${id}/activation`, { isActive });
  }
}
