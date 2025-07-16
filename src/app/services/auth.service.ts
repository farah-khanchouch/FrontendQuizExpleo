import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();


  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }
  

  login(email: string, password: string): Observable<User> {
    return new Observable(observer => {
      this.http.post<any>('http://localhost:3000/api/auth/login', {
        email,
        password
      }).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          observer.next(res.user);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
  
  loginWithGoogle(token: string): Observable<User> {
    return new Observable(observer => {
      this.http.post<any>('http://localhost:3000/api/auth/login/google', { token }).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          observer.next(res.user);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
  
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
  register(userData: {
    fullname: string,
    email: string,
    password: string,
    confirmPassword: string,
    cbu: string
  }): Observable<any> {
    return this.http.post('http://localhost:3000/api/auth/register', userData);
  }
  
}