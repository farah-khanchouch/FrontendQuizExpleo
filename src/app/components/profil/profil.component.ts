import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/user.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NavbarComponent],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

  user: User | null = null;
  editableUser: any = {};
  originalUser: any = {};
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.editableUser = { ...this.user };
      this.originalUser = { ...this.user };
    }
  }

  onSave() {
    if (!this.user || !this.hasChanges()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Préparer les données à envoyer
    const profileData = {
      username: this.editableUser.username,
      email: this.editableUser.email,
      cbu: this.editableUser.cbu,
      avatar: this.editableUser.avatar
    };

    // Utiliser PATCH pour mise à jour partielle
    this.userService.updateUser(this.user.id, profileData).subscribe({
      next: (updatedUser) => {
        console.log('Profil mis à jour avec succès:', updatedUser);

        // Mettre à jour les données locales
        if (this.user) {
          this.user = {
            ...this.user,
            username: updatedUser.username,
            email: updatedUser.email,
            cbu: updatedUser.cbu || '',
            avatar: updatedUser.avatar || ''
          };

          // Mettre à jour dans AuthService (localStorage)
          this.authService.updateCurrentUser(this.user);
        }

        // Réinitialiser les données de référence
        this.originalUser = { ...this.user };
        this.editableUser = { ...this.user };

        this.successMessage = 'Profil mis à jour avec succès !';
        this.isLoading = false;

        // Masquer le message après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.errorMessage = error.error?.error || 'Erreur lors de la mise à jour du profil';
        this.isLoading = false;
      }
    });
  }

  onCancel() {
    if (this.user) {
      this.editableUser = { ...this.originalUser };
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  selectAvatar(nouvelAvatar: string) {
    if (!this.user) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.updateUser(this.user.id, { avatar: nouvelAvatar }).subscribe({
      next: (updatedUser) => {
        console.log('Avatar mis à jour:', updatedUser);

        // Mettre à jour toutes les références
        this.user!.avatar = updatedUser.avatar;
        this.editableUser.avatar = updatedUser.avatar;
        this.originalUser.avatar = updatedUser.avatar;

        // Mettre à jour dans AuthService
        this.authService.updateCurrentUser(this.user!);

        this.showAvatarSelector = false;
        this.isLoading = false;
        this.successMessage = 'Avatar mis à jour avec succès !';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'avatar:', error);
        this.errorMessage = 'Erreur lors de la mise à jour de l\'avatar';
        this.isLoading = false;
      }
    });
  }

  availableAvatars = [
    'av1.jpg', 'av2.jpg', 'av3.jpg', 'av4.jpg', 'av5.jpg', 'av6.jpg',
    'av7.jpg', 'av9.jpg', 'av10.jpg', 'av11.jpg', 'av12.jpg', 'av13.jpg',
    'av14.jpg', 'av15.jpg', 'av16.jpg', 'av17.jpg', 'av18.jpg', 'av19.jpg',
    'av20.jpg', 'av21.jpg', 'av22.jpg', 'av23.jpg', 'av24.jpg', 'av25.jpg',
    'av26.jpg', 'av27.jpg'
  ];

  showAvatarSelector = false;

  openAvatarSelector() {
    this.showAvatarSelector = true;
  }

  hasChanges(): boolean {
    return this.editableUser.username !== this.originalUser.username ||
      this.editableUser.email !== this.originalUser.email ||
      this.editableUser.cbu !== this.originalUser.cbu ||
      this.editableUser.avatar !== this.originalUser.avatar;
  }

  // Méthodes dépréciées - gardées pour compatibilité mais non utilisées
  changeAvatar(nouvelAvatar: string) {
    this.selectAvatar(nouvelAvatar);
  }

  updateAvatar(nouvelAvatar: string) {
    this.selectAvatar(nouvelAvatar);
  }
}