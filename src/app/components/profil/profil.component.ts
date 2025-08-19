import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/user.model'; // Vérifie ce chemin
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NavbarComponent],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})

export class ProfilComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService) { }


  editableUser: any = {};
  originalUser: any = {};

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.editableUser = { ...this.user, department: '' };
      this.originalUser = { ...this.user, department: '' };
    }
  }

  onSave() {
    if (this.user) {
      // Met à jour l'objet user avec les nouvelles valeurs
      this.user.username = this.editableUser.username;
      this.user.email = this.editableUser.email;
      this.user.cbu = this.editableUser.cbu;
      this.user.avatar = this.editableUser.avatar;
      this.authService.updateCurrentUser(this.user);
      this.originalUser = { ...this.editableUser };
      // Optionnel: Afficher une notification de succès
      alert('Profil mis à jour avec succès !');
    }
  }

  onCancel() {
    if (this.user) {
      this.editableUser = { ...this.user, department: '' };
    }
  }
  changeAvatar(nouvelAvatar: string) {
    if (this.user) {
      this.user.avatar = nouvelAvatar;
      this.authService.updateCurrentUser(this.user);
    }
  }
  availableAvatars = [
    'av1.jpg',
    'av2.jpg',
    'av3.jpg',
    'av4.jpg',
    'av5.jpg',
    'av6.jpg',
    'av7.jpg',
    'av9.jpg',
    'av10.jpg',
    'av11.jpg',
    'av12.jpg',
    'av13.jpg',
    'av14.jpg',
    'av15.jpg',
    'av16.jpg',
    'av17.jpg',
    'av18.jpg',
    'av19.jpg',
    'av20.jpg',
    'av21.jpg',
    'av22.jpg',
    'av23.jpg',
    'av24.jpg',
    'av25.jpg',
    'av26.jpg',
    'av27.jpg',




    // Ajoute tous les noms d’avatars ici
  ];

  showAvatarSelector = false;

  openAvatarSelector() {
    this.showAvatarSelector = true;
  }

  selectAvatar(avatar: string) {
    this.changeAvatar(avatar); // utilise déjà ta méthode dynamique
    this.showAvatarSelector = false;
  }

  hasChanges(): boolean {
    return this.editableUser.username !== this.originalUser.username ||
      this.editableUser.email !== this.originalUser.email ||
      this.editableUser.cbu !== this.originalUser.cbu ||
      this.editableUser.avatar !== this.originalUser.avatar;
  }
}
