import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthService } from '../../services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;


  constructor(
    private authService: AuthService,
    private router: Router,
    private googleAuthService: GoogleAuthService
  ) {}

  // 🔍 Ajoute ce hook ici
  ngOnInit(): void {
    console.log('✅ LoginComponent chargé !');
  }
 
  ngAfterViewInit(): void {
    this.googleAuthService.initializeGoogleSignIn('google-signin-button');
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  
  
  

  onLogin(): void {
    
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user) {
            // Vérifie le rôle de l'utilisateur
          if (user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      }
      
    });
    
  }
  onGoogleSignIn(): void {
  this.isLoading = true;

  this.googleAuthService.signInWithGoogle().subscribe({
    next: (user) => {
      this.isLoading = false;
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
      }
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = 'Échec de la connexion Google.';
      console.error('Erreur Google Sign-In:', err);
    }
  });
}

goToExpleoSite(): void {
  window.open('https://expleo.com/global/fr/contact/', '_blank');
}
goToRegister() {
  this.router.navigate(['/register']);
}

}
