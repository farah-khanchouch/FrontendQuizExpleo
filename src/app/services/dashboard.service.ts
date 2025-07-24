import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserStats {
  quizCompleted: number;
  averageScore: number;
  ranking: number;
  totalTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>('/api/quiz/stats');
  }
}
