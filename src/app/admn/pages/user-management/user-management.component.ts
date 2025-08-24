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
  
  // Ajout d'un indicateur de chargement
  isLoading = false;
  loadingMessage = 'Chargement des utilisateurs...';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  // ✅ NOUVELLE MÉTHODE : Chargement des utilisateurs avec gestion d'erreur améliorée
  private loadUsers(): void {
    console.log('🔄 Démarrage du chargement des utilisateurs...');
    this.isLoading = true;
    this.loadingMessage = 'Récupération des données utilisateurs...';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Utilisateurs récupérés avec succès:', users.length);
        
        if (users && users.length > 0) {
          console.log('📊 Exemple d\'utilisateur avec stats:', users[0]);
          
          this.users = users;
          this.departments = [...new Set(users.map(u => u.cbu || 'Non défini'))];
          
          console.log('📈 Statistiques des utilisateurs:');
          users.forEach((user, index) => {
            if (index < 5) { // Afficher les stats des 5 premiers utilisateurs pour debug
              console.log(`👤 ${user.username}:`, {
                totalQuizzes: user.totalQuizzes,
                completedQuizzes: user.completedQuizzes,
                averageScore: user.averageScore,
                badges: user.badges,
                completionRate: user.completionRate
              });
            }
          });
          
          console.log('🏢 Départements trouvés:', this.departments);
        } else {
          console.warn('⚠️ Aucun utilisateur reçu');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        this.isLoading = false;
        this.loadingMessage = 'Erreur lors du chargement';
        
        // Optionnel : afficher un message d'erreur à l'utilisateur
        alert('Erreur lors du chargement des utilisateurs. Veuillez réessayer.');
      }
    });
  }

  // ✅ NOUVELLE MÉTHODE : Forcer le rechargement des statistiques
  refreshUserStats(): void {
    console.log('🔄 Rechargement des statistiques...');
    this.loadingMessage = 'Recalcul des statistiques en cours...';
    this.loadUsers(); // Recharger tout simplement
  }

  // ✅ MÉTHODE AMÉLIORÉE : Obtenir les statistiques globales
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
    
    // Calcul de la completion moyenne basée sur les vraies stats
    const usersWithQuizzes = this.users.filter(u => u.totalQuizzes && u.totalQuizzes > 0);
    let averageCompletion = 0;
    
    if (usersWithQuizzes.length > 0) {
      const totalCompletion = usersWithQuizzes.reduce((sum, u) => {
        const completion = u.completionRate || 0;
        return sum + completion;
      }, 0);
      averageCompletion = Math.round(totalCompletion / usersWithQuizzes.length);
    }

    console.log('📊 Stats globales calculées:', {
      total, active, inactive, averageCompletion,
      usersWithQuizzes: usersWithQuizzes.length
    });

    return {
      total,
      active,
      inactive,
      averageCompletion
    };
  }

  toggleUserStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.userService.updateUser(user.id, { status: newStatus }).subscribe(updated => {
      user.status = updated.status;
    });
  }

  get filteredUsers() {
    if (!this.users || this.users.length === 0) {
      console.log('🔍 Aucun utilisateur à filtrer');
      return [];
    }

    const filtered = this.users.filter(user => {
      const username = user.username || '';
      const email = user.email || '';
      const cbu = user.cbu || '';
      const status = user.status || 'inactive';

      const matchesSearch = !this.searchTerm || 
                           username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || status === this.statusFilter;
      const matchesDepartment = this.departmentFilter === 'all' || cbu === this.departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });

    console.log('🔍 Filtrage:', {
      total: this.users.length,
      filtered: filtered.length,
      filters: {
        search: this.searchTerm,
        status: this.statusFilter,
        department: this.departmentFilter
      }
    });

    return filtered;
  }

  blockUser(user: User) {
    if (confirm(`Êtes-vous sûr de vouloir bloquer ${user.username} ?`)) {
      this.userService.updateUser(user.id, { status: 'blocked' }).subscribe({
        next: (updated) => {
          user.status = updated.status;
          console.log(`👤 Utilisateur ${user.username} bloqué`);
        },
        error: (error) => {
          console.error('❌ Erreur lors du blocage:', error);
        }
      });
    }
  }

  deleteUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user?.username} ?`)) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          console.log(`👤 Utilisateur supprimé: ${user?.username}`);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
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

  // ✅ MÉTHODE CORRIGÉE : Calcul du taux de completion
  getCompletionRate(user: User): number {
    if (!user.totalQuizzes || user.totalQuizzes === 0) {
      return 0;
    }
    // Utiliser directement completionRate si disponible, sinon calculer
    if (user.completionRate !== undefined) {
      return user.completionRate;
    }
    return Math.round(((user.completedQuizzes || 0) / user.totalQuizzes) * 100);
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir les détails de performance d'un utilisateur
  getUserPerformanceDetails(user: User): {
    hasData: boolean;
    performance: string;
    color: string;
    message: string;
  } {
    if (!user.completedQuizzes || user.completedQuizzes === 0) {
      return {
        hasData: false,
        performance: 'Aucune donnée',
        color: '#6b7280',
        message: 'N\'a pas encore commencé de quiz'
      };
    }

    const avgScore = user.averageScore || 0;
    let performance = '';
    let color = '';
    let message = '';

    if (avgScore >= 90) {
      performance = 'Excellent';
      color = '#10b981';
      message = 'Performance exceptionnelle';
    } else if (avgScore >= 80) {
      performance = 'Très bien';
      color = '#3b82f6';
      message = 'Très bonne performance';
    } else if (avgScore >= 70) {
      performance = 'Bien';
      color = '#f59e0b';
      message = 'Bonne performance';
    } else if (avgScore >= 60) {
      performance = 'Passable';
      color = '#ef4444';
      message = 'Performance à améliorer';
    } else {
      performance = 'À améliorer';
      color = '#dc2626';
      message = 'Nécessite un accompagnement';
    }

    return {
      hasData: true,
      performance,
      color,
      message
    };
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir le badge de niveau d'un utilisateur
  getUserLevelBadge(user: User): {
    level: string;
    color: string;
    icon: string;
  } {
    const completedQuizzes = user.completedQuizzes || 0;
    
    if (completedQuizzes >= 50) {
      return { level: 'Expert', color: '#8b5cf6', icon: '👑' };
    } else if (completedQuizzes >= 25) {
      return { level: 'Avancé', color: '#10b981', icon: '⭐' };
    } else if (completedQuizzes >= 10) {
      return { level: 'Intermédiaire', color: '#3b82f6', icon: '📚' };
    } else if (completedQuizzes >= 5) {
      return { level: 'Débutant+', color: '#f59e0b', icon: '🌱' };
    } else if (completedQuizzes > 0) {
      return { level: 'Débutant', color: '#6b7280', icon: '🎯' };
    } else {
      return { level: 'Nouveau', color: '#9ca3af', icon: '👋' };
    }
  }

  // ✅ MÉTHODE UTILITAIRE : Export des données
  exportUsers() {
    try {
      const csvData = [
        // En-têtes
        'Nom,Email,CBU,Quiz Complétés,Quiz Disponibles,Score Moyen,Taux Completion,Badges,Statut,Dernière Activité',
        // Données
        ...this.filteredUsers.map(user => 
          `${user.username || 'N/A'},${user.email || 'N/A'},${user.cbu || 'N/A'},${user.completedQuizzes || 0},${user.totalQuizzes || 0},${user.averageScore || 0}%,${this.getCompletionRate(user)}%,${user.badges || 0},${this.getStatusLabel(user.status)},${user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('fr-FR') : 'N/A'}`
        )
      ].join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('📊 Export CSV généré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
  }

  // ✅ NOUVELLES MÉTHODES DE DEBUG
  debugUser(user: User): void {
    console.log('🐛 Debug utilisateur:', {
      id: user.id,
      username: user.username,
      email: user.email,
      cbu: user.cbu,
      totalQuizzes: user.totalQuizzes,
      completedQuizzes: user.completedQuizzes,
      averageScore: user.averageScore,
      badges: user.badges,
      completionRate: user.completionRate,
      status: user.status,
      lastActivity: user.lastActivity
    });
  }

  debugAllUsers(): void {
    console.log('🐛 Debug tous les utilisateurs:', {
      total: this.users.length,
      filtered: this.filteredUsers.length,
      stats: this.stats,
      users: this.users.map(u => ({
        username: u.username,
        completedQuizzes: u.completedQuizzes,
        totalQuizzes: u.totalQuizzes,
        averageScore: u.averageScore
      }))
    });
  }

  // ✅ MÉTHODE UTILITAIRE : Forcer la synchronisation des stats
  syncUserStats(user: User): void {
    console.log(`🔄 Synchronisation des stats pour ${user.username}...`);
    this.userService.syncUserStats(user.id).subscribe({
      next: (updatedUser) => {
        console.log(`✅ Stats synchronisées pour ${user.username}:`, updatedUser);
        // Recharger les données
        this.loadUsers();
      },
      error: (error) => {
        console.error(`❌ Erreur lors de la synchro pour ${user.username}:`, error);
      }
    });
  }
}