import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--white);
    }
    
    .main-content {
      flex: 1;
      padding: 32px;
      margin-left: 280px;
      transition: margin-left 0.3s ease;
      background-color: var(--light-grey);
    }
    
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 16px;
      }
    }
  `]
})
export class AppComponent {
  title = 'Quiz Admin Dashboard';
}