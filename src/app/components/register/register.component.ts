import { Component,AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthService } from '../../services/google-auth.service';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
    export class RegisterComponent {
      // Ajoute cette ligne (avec valeur par défaut false)
      isLoading: boolean = false;
    
      // Ajoute aussi les autres variables du formulaire
      fullname: string = '';
      email: string = '';
      cbu: string = '';  
      password: string = '';
      confirmPassword: string = '';
    
      showPassword: boolean = false;
      showConfirmPassword: boolean = false;
    
      errorMessage: string = '';
      cbuList: string[] = [
        "PCPR : Product Conformity Performance Reliability",
        "ME : Manufacturing Engineering",
        "EES : Electronic Embedded Systems",
        "DET : Digital and Technology",
        "MPE : Mechanical Product Engineering",
        "CSP ",
        "SGA"

      ];
      constructor(
        private authService: AuthService,
        private router: Router,
        private googleAuthService: GoogleAuthService
      ) {}
      // Méthode pour basculer la visibilité du mot de passe
      togglePassword() {
        this.showPassword = !this.showPassword;
      }
    
      toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
      }
    
      // Exemple de méthode onRegister
      onRegister() {
        this.errorMessage = '';
      
        if (this.password !== this.confirmPassword) {
          this.errorMessage = 'Les mots de passe ne correspondent pas.';
          return;
        }
      
        const userData = {
          fullname: this.fullname,
          email: this.email,
          password: this.password,
          confirmPassword: this.confirmPassword,
          cbu: this.cbu
        };
      
        this.authService.register(userData).subscribe({
          next: () => {
            alert('Inscription réussie');
            this.router.navigate(['/login']);
          },
          error: (err) => {
            this.errorMessage = err.error.message || 'Erreur lors de l’inscription';
          }
        });
      }
      

      goToExpleoSite(): void {
        window.open('https://expleo.com/global/fr/contact/', '_blank');
      } 
      goToLogin() {
        this.router.navigate(['/login']);
      }
    
      // Méthode pour la connexion Google (à adapter selon ton projet)
      
    }    
   
    

    
