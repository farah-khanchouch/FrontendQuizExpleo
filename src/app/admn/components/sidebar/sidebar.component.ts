import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css', '../../global_styles.css']
})
export class SidebarComponent {
  menuItems = [
    { 
      icon: '', 
      label: 'Dashboard', 
      route: '/admin/dashboard',
      description: 'Vue d\'ensemble'
    },
    { 
      icon: '', 
      label: 'Quiz', 
      route: '/admin/quiz-management',
      description: 'Gestion des quiz'
    },
    { 
      icon: '', 
      label: 'Collaborateurs', 
      route: '/admin/user-management',
      description: 'Gestion des utilisateurs'
    },
    { 
      icon: '', 
      label: 'Badges', 
      route: '/admin/badge-management',
      description: 'Récompenses'
    }
  ];
  

  constructor(private router: Router) {}

}