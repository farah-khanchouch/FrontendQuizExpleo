import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizManagementComponent } from './pages/quiz-management/quiz-management.component';
import { QuestionManagementComponent } from './pages/question-management/question-management.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { BadgeManagementComponent } from './pages/badge-management/badge-management.component';
import { AdminGuard } from '../guards/admin.guard';

export const adminRoutes: Routes = [
  { path: '', component: AppComponent, 
    children: [
      { path: 'dashboard', component: DashboardComponent,   canActivate: [AdminGuard]      },
      { path: 'quiz-management', component: QuizManagementComponent, canActivate: [AdminGuard] },
      { path: 'question-management/:quizId', component: QuestionManagementComponent,  canActivate: [AdminGuard]  },
      { path: 'user-management', component: UserManagementComponent,  canActivate: [AdminGuard]  },
      { path: 'badge-management', component: BadgeManagementComponent, canActivate: [AdminGuard]  },
      { path: '**', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  }
];