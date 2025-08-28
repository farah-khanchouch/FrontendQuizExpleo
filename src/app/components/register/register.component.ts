import { Component, AfterViewInit, OnInit } from '@angular/core';
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
  passwordStrength: number = 0;
  passwordFeedback: string[] = [];
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showPasswordRequirements: boolean = false;

  errorMessage: string = '';
  cbuList: string[] = [
    "PCPR : Product Conformity Performance Reliability",
    "ME : Manufacturing Engineering",
    "EES : Electronic Embedded Systems",
    "DET : Digital and Technology",
    "MPE : Mechanical Product Engineering",
    "CSP : Corporate Service Provider",
    "SGA"

  ];
  constructor(
    private authService: AuthService,
    private router: Router,
    private googleAuthService: GoogleAuthService
  ) { }
  // Méthode pour basculer la visibilité du mot de passe
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkPasswordStrength() {
    this.passwordRequirements = {
      minLength: this.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasLowerCase: /[a-z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(this.password)
    };

    this.passwordFeedback = [];
    if (!this.passwordRequirements.minLength) this.passwordFeedback.push('Au moins 8 caractères');
    if (!this.passwordRequirements.hasUpperCase) this.passwordFeedback.push('Au moins une majuscule');
    if (!this.passwordRequirements.hasLowerCase) this.passwordFeedback.push('Au moins une minuscule');
    if (!this.passwordRequirements.hasNumber) this.passwordFeedback.push('Au moins un chiffre');
    if (!this.passwordRequirements.hasSpecialChar) this.passwordFeedback.push('Au moins un caractère spécial');

    // Calcul du score de force (0-100)
    const requirementsMet = Object.values(this.passwordRequirements).filter(Boolean).length;
    this.passwordStrength = (requirementsMet / 5) * 100;
  }

  isPasswordValid(): boolean {
    return Object.values(this.passwordRequirements).every(req => req);
  }

  // Exemple de méthode onRegister
  onRegister() {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.isPasswordValid()) {
      this.errorMessage = 'Le mot de passe ne remplit pas les exigences de sécurité.';
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
        alert('');
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
