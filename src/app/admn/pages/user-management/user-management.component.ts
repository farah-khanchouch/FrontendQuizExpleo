import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css', '../../global_styles.css']
})

export class UserManagementComponent implements OnInit {
  users: User[] = [];
  departments: string[] = [];
  searchTerm = '';
  statusFilter = 'all';
  departmentFilter = 'all';
  
  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Utilisateurs récupérés:', users); // Pour debug
        this.users = users;
        this.departments = [...new Set(users.map(u => u.cbu || 'Non défini'))];
        console.log('Nombre d\'utilisateurs:', this.users.length);
        console.log('Départements:', this.departments);
      },
      
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    });
  }
  toggleUserStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.userService.updateUser(user.id, { status: newStatus }).subscribe(updated => {
      user.status = updated.status;
    });
  }
  
  
  get filteredUsers() {
    if (!this.users || this.users.length === 0) {
      console.log('Aucun utilisateur à filtrer');
      return [];
    }

    const filtered = this.users.filter(user => {
      // Protection contre les valeurs undefined/null
      const username = user.username || '';
      const email = user.email || '';
      const cbu = user.cbu || '';
      const status = user.status || 'inactive';

      // Filtre de recherche
      const matchesSearch = !this.searchTerm || 
                           username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filtre de statut
      const matchesStatus = this.statusFilter === 'all' || status === this.statusFilter;
      
      // Filtre de département
      const matchesDepartment = this.departmentFilter === 'all' || cbu === this.departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });

    console.log('Filtres appliqués:', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      departmentFilter: this.departmentFilter
    });
    console.log('Utilisateurs filtrés:', filtered.length, 'sur', this.users.length);
    return filtered;
  }
  get stats() {
    if (!this.users || this.users.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        averageCompletion: 0
      };
    }

    const total = this.users.length;
    const active = this.users.filter(u => u.status === 'active').length;
    const inactive = this.users.filter(u => u.status === 'inactive').length;
    
    // Calcul sécurisé de la completion moyenne
    const validUsers = this.users.filter(u => u.totalQuizzes && u.totalQuizzes > 0);
    let averageCompletion = 0;
    
    if (validUsers.length > 0) {
      const totalCompletion = validUsers.reduce((sum, u) => {
        const completion = (u.completedQuizzes || 0) / u.totalQuizzes * 100;
        return sum + completion;
      }, 0);
      averageCompletion = Math.round(totalCompletion / validUsers.length);
    }

    return {
      total,
      active,
      inactive,
      averageCompletion
    };
  }

  blockUser(user: User) {
    if (confirm(`Êtes-vous sûr de vouloir bloquer ${user.username} ?`)) {
      this.userService.updateUser(user.id, { status: 'blocked' }).subscribe({
        next: (updated) => {
          user.status = updated.status;
        },
        error: (error) => {
          console.error('Erreur lors du blocage:', error);
        }
      });
    }
  }

  deleteUser(userId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
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
    if (!user.totalQuizzes || user.totalQuizzes === 0) {
      return 0;
    }
    return Math.round(((user.completedQuizzes || 0) / user.totalQuizzes) * 100);
  }
  exportUsers() {
    // Simulation d'export
    const csvData = this.filteredUsers.map(user => 
      `${user.username},${user.email},${user.cbu},${user.averageScore},${this.getCompletionRate(user)}%`
    ).join('\n');
    
    console.log('Export CSV:', csvData);
    alert('Export des données en cours... (simulation)');
  }
  // Méthodes de debug utiles
  debugFilters() {
    console.log('=== DEBUG FILTRES ===');
    console.log('Total users:', this.users.length);
    console.log('Search term:', this.searchTerm);
    console.log('Status filter:', this.statusFilter);
    console.log('Department filter:', this.departmentFilter);
    console.log('Filtered users:', this.filteredUsers.length);
    console.log('Users data sample:', this.users.slice(0, 2));
  }

  // Méthode pour forcer la mise à jour (debug)
  refreshData() {
    this.ngOnInit();
  }
}