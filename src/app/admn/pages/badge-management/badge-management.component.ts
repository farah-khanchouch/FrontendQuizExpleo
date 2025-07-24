import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  isActive: boolean;
  createdAt: Date;
  earnedBy: number;
  type: 'achievement' | 'milestone' | 'special';
}

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './badge-management.component.html',
  styleUrls: ['./badge-management.component.css', '../../global_styles.css']
})
export class BadgeManagementComponent {
  showCreateModal = false;
  editingBadge: Badge | null = null;
  
  newBadge = {
    name: '',
    description: '',
    icon: '🏆',
    color: '#6846C6',
    criteria: '',
    type: 'achievement' as 'achievement' | 'milestone' | 'special'
  };

  availableIcons = ['🏆', '🥇', '🎯', '⭐', '💎', '🔥', '⚡', '🚀', '🎖️', '👑', '🥈', '🥉'];
  availableColors = ['#6846C6', '#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2', '#BE185D'];

  badges: Badge[] = [
    {
      id: 1,
      name: 'Premier Pas',
      description: 'Terminer son premier quiz',
      icon: '🎯',
      color: '#059669',
      criteria: 'Compléter 1 quiz',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      earnedBy: 85,
      type: 'milestone'
    },
    {
      id: 2,
      name: 'Expert JavaScript',
      description: 'Maîtrise parfaite du JavaScript',
      icon: '⚡',
      color: '#D97706',
      criteria: 'Score > 90% sur tous les quiz JS',
      isActive: true,
      createdAt: new Date('2024-01-02'),
      earnedBy: 12,
      type: 'achievement'
    },
    {
      id: 3,
      name: 'Quiz Master',
      description: 'Compléter tous les quiz disponibles',
      icon: '👑',
      color: '#7C3AED',
      criteria: 'Compléter 100% des quiz',
      isActive: true,
      createdAt: new Date('2024-01-03'),
      earnedBy: 3,
      type: 'special'
    },
    {
      id: 4,
      name: 'Perfectionniste',
      description: 'Score parfait sur un quiz difficile',
      icon: '💎',
      color: '#BE185D',
      criteria: 'Score de 100% sur quiz niveau expert',
      isActive: true,
      createdAt: new Date('2024-01-04'),
      earnedBy: 7,
      type: 'achievement'
    },
    {
      id: 5,
      name: 'Débutant Motivé',
      description: 'Compléter 5 quiz en une semaine',
      icon: '🔥',
      color: '#0891B2',
      criteria: '5 quiz en 7 jours',
      isActive: false,
      createdAt: new Date('2024-01-05'),
      earnedBy: 0,
      type: 'milestone'
    }
  ];

  openCreateModal() {
    this.showCreateModal = true;
    this.newBadge = {
      name: '',
      description: '',
      icon: '🏆',
      color: '#6846C6',
      criteria: '',
      type: 'achievement'
    };
  }

  closeModal() {
    this.showCreateModal = false;
    this.editingBadge = null;
  }

  createBadge() {
    if (this.newBadge.name && this.newBadge.description) {
      const badge: Badge = {
        id: Math.max(...this.badges.map(b => b.id)) + 1,
        name: this.newBadge.name,
        description: this.newBadge.description,
        icon: this.newBadge.icon,
        color: this.newBadge.color,
        criteria: this.newBadge.criteria,
        type: this.newBadge.type,
        isActive: true,
        createdAt: new Date(),
        earnedBy: 0
      };
      this.badges.push(badge);
      this.closeModal();
    }
  }

  editBadge(badge: Badge) {
    this.editingBadge = { ...badge };
    this.showCreateModal = true;
  }

  updateBadge() {
    if (this.editingBadge) {
      const index = this.badges.findIndex(b => b.id === this.editingBadge!.id);
      if (index !== -1) {
        this.badges[index] = { ...this.editingBadge };
      }
      this.closeModal();
    }
  }

  deleteBadge(badgeId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) {
      this.badges = this.badges.filter(b => b.id !== badgeId);
    }
  }

  toggleBadgeStatus(badge: Badge) {
    badge.isActive = !badge.isActive;
  }

  duplicateBadge(badge: Badge) {
    const duplicated: Badge = {
      ...badge,
      id: Math.max(...this.badges.map(b => b.id)) + 1,
      name: `${badge.name} (Copie)`,
      createdAt: new Date(),
      earnedBy: 0,
      isActive: false
    };
    this.badges.push(duplicated);
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'achievement': return 'type-achievement';
      case 'milestone': return 'type-milestone';
      case 'special': return 'type-special';
      default: return 'type-achievement';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'achievement': return 'Accomplissement';
      case 'milestone': return 'Étape';
      case 'special': return 'Spécial';
      default: return type;
    }
  }

  get stats() {
    return {
      total: this.badges.length,
      active: this.badges.filter(b => b.isActive).length,
      totalEarned: this.badges.reduce((sum, b) => sum + b.earnedBy, 0),
      specialBadgesCount: this.badges.filter(b => b.type === 'special').length
    };
  }
}