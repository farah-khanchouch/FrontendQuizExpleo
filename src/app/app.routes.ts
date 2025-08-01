import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ResultsComponent } from './components/results/results.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { StatsComponent } from './components/stats/stats.component';
import { ClassementComponent } from './components/classement/classement.component';
import { ProfilComponent } from './components/profil/profil.component';
import { adminRoutes } from './admn/app.routes';
import { AdminGuard } from './guards/admin.guard';


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', loadChildren: () => import('./admn/app.routes').then(m => m.adminRoutes) },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'quizzes', component: QuizListComponent, canActivate: [AuthGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [AuthGuard] }, 
  { path: 'classement', component: ClassementComponent, canActivate: [AuthGuard] },
  { path: 'profil', component: ProfilComponent, canActivate: [AuthGuard] },
  { path: 'quiz/:id', component: QuizComponent, canActivate: [AuthGuard] },
  { path: 'results/:quizId', component: ResultsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];  
