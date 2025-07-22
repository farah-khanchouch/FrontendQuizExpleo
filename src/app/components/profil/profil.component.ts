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

  constructor(private authService: AuthService) {}

 
  editableUser: any = {};

ngOnInit(): void {
  this.user = this.authService.getCurrentUser();
  if (this.user) {
    this.editableUser = { ...this.user, department: '' };
  }
}

onSave() {
  console.log('✅ Données sauvegardées :', this.editableUser);
  // 👉 Ici, tu peux appeler un service pour sauvegarder les données si tu veux
}

onCancel() {
  if (this.user) {
    this.editableUser = { ...this.user, department: '' };
  }
}

  }

