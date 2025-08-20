import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { StatsService } from './stats.service';

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
  constructor(private http: HttpClient,
    private authService: AuthService,
    private statsService: StatsService

  ) {}

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>('/api/quiz/stats');
  }
  
}
