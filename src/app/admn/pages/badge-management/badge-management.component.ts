import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeService } from '../../../services/badge.service';
import { Badge } from '../../../../models/quiz.model';

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './badge-management.component.html',
  styleUrls: ['./badge-management.component.css', '../../global_styles.css']
})
export class BadgeManagementComponent implements OnInit {
  showCreateModal = false;
  editingBadge: Badge | null = null;
  badges: Badge[] = [];
  loading = false;

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

  constructor(private badgeService: BadgeService) {}

  ngOnInit() {
    this.loadBadges();
  }

  loadBadges() {
    this.loading = true;
    this.badgeService.getBadges().subscribe({
      next: (data) => {
        this.badges = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des badges', err);
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.editingBadge = null;
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
    const badgePayload = {
      ...this.newBadge,
      isActive: true,
      createdAt: new Date(),
      earnedBy: 0
    };

    this.badgeService.createBadge(badgePayload).subscribe({
      next: (created) => {
        this.badges.push(created);
        this.closeModal();
      },
      error: (err) => {
        console.error('Erreur création badge', err);
      }
    });
  }

  editBadge(badge: Badge) {
    this.editingBadge = { ...badge };
    this.showCreateModal = true;
  }

  updateBadge() {
    if (!this.editingBadge) return;
    this.badgeService.updateBadge(this.editingBadge._id, this.editingBadge).subscribe({
      next: (updatedBadge) => {
        // Mets à jour la liste sans reload
        this.badges = this.badges.map(b =>
          b._id === updatedBadge._id ? updatedBadge : b
        );
        this.closeModal();
      },
      error: (err) => {
        console.error('Erreur mise à jour badge', err);
        alert('Erreur lors de la modification du badge.');
      }
    });
  }

  deleteBadge(badgeId: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce badge ?')) return;
    this.badgeService.deleteBadge(badgeId).subscribe({
      next: () => {
        this.badges = this.badges.filter(b => b._id !== badgeId); // ← Cette ligne est ESSENTIELLE
      },
      error: (err) => {
        console.error('Erreur suppression badge', err);
        alert('Erreur lors de la suppression du badge.');
      }
    });
  }

  toggleBadgeStatus(badge: Badge) {
    this.badgeService.toggleBadgeActivation(badge._id, !badge.isActive).subscribe({
      next: (updatedBadge) => {
        // Mets à jour le statut localement sans reload
        this.badges = this.badges.map(b =>
          b._id === updatedBadge._id ? updatedBadge : b
        );
      },
      error: (err) => {
        console.error('Erreur activation badge', err);
        alert('Erreur lors de l’activation/désactivation du badge.');
      }
    });
  }

  duplicateBadge(badge: Badge) {
    const { _id, id, ...rest } = badge; // Retire les IDs
const duplicated = {
  ...rest,
  name: badge.name + '',
  isActive: false,
  earnedBy: 0,
  createdAt: new Date()
};

this.badgeService.createBadge(duplicated).subscribe({
  next: (newBadge) => {
    this.badges.push(newBadge); // La copie s’affiche immédiatement
  },
  error: (err) => {
    console.error('Erreur duplication badge', err);
  }
});
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
