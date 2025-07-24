import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  joinedAt: Date;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  badges: number;
  status: 'active' | 'inactive' | 'blocked';
  lastActivity: Date;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css', '../../global_styles.css']
})
export class UserManagementComponent {
  searchTerm = '';
  statusFilter = 'all';
  departmentFilter = 'all';
  
  users: User[] = [
    {
      id: 1,
      name: 'Marie Dupont',
      email: 'marie.dupont@company.com',
      department: 'Développement',
      joinedAt: new Date('2024-01-10'),
      totalQuizzes: 12,
      completedQuizzes: 8,
      averageScore: 94,
      badges: 5,
      status: 'active',
      lastActivity: new Date('2024-01-28')
    },
    {
      id: 2,
      name: 'Jean-Pierre Leroy',
      email: 'jp.leroy@company.com',
      department: 'Marketing',
      joinedAt: new Date('2024-01-05'),
      totalQuizzes: 12,
      completedQuizzes: 12,
      averageScore: 91,
      badges: 7,
      status: 'active',
      lastActivity: new Date('2024-01-27')
    },
    {
      id: 3,
      name: 'Alice Roux',
      email: 'alice.roux@company.com',
      department: 'Design',
      joinedAt: new Date('2024-01-15'),
      totalQuizzes: 12,
      completedQuizzes: 6,
      averageScore: 89,
      badges: 4,
      status: 'active',
      lastActivity: new Date('2024-01-26')
    },
    {
      id: 4,
      name: 'Paul Durand',
      email: 'paul.durand@company.com',
      department: 'Développement',
      joinedAt: new Date('2024-01-20'),
      totalQuizzes: 12,
      completedQuizzes: 9,
      averageScore: 86,
      badges: 6,
      status: 'active',
      lastActivity: new Date('2024-01-25')
    },
    {
      id: 5,
      name: 'Sophie Bernard',
      email: 'sophie.bernard@company.com',
      department: 'RH',
      joinedAt: new Date('2024-01-12'),
      totalQuizzes: 12,
      completedQuizzes: 3,
      averageScore: 75,
      badges: 2,
      status: 'inactive',
      lastActivity: new Date('2024-01-20')
    }
  ];

  departments = ['Développement', 'Marketing', 'Design', 'RH'];

  get filteredUsers() {
    return this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || user.status === this.statusFilter;
      const matchesDepartment = this.departmentFilter === 'all' || user.department === this.departmentFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }

  get stats() {
    return {
      total: this.users.length,
      active: this.users.filter(u => u.status === 'active').length,
      inactive: this.users.filter(u => u.status === 'inactive').length,
      averageCompletion: Math.round(
        this.users.reduce((sum, u) => sum + (u.completedQuizzes / u.totalQuizzes * 100), 0) / this.users.length
      )
    };
  }

  toggleUserStatus(user: User) {
    if (user.status === 'active') {
      user.status = 'inactive';
    } else if (user.status === 'inactive') {
      user.status = 'active';
    }
  }

  blockUser(user: User) {
    if (confirm(`Êtes-vous sûr de vouloir bloquer ${user.name} ?`)) {
      user.status = 'blocked';
    }
  }

  deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      this.users = this.users.filter(u => u.id !== userId);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-warning';
      case 'blocked': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  }

  getCompletionRate(user: User): number {
    return Math.round((user.completedQuizzes / user.totalQuizzes) * 100);
  }

  exportUsers() {
    // Simulation d'export
    const csvData = this.filteredUsers.map(user => 
      `${user.name},${user.email},${user.department},${user.averageScore},${this.getCompletionRate(user)}%`
    ).join('\n');
    
    console.log('Export CSV:', csvData);
    alert('Export des données en cours... (simulation)');
  }
}