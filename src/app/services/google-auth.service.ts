import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';


declare const google: any;  // Pour accéder à la librairie Google (charge via script)

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private clientId = '321176031711-4u5349s5hdqj4bjeknu9fj51jfee4kkk.apps.googleusercontent.com'; // Remplace par ton vrai client ID Google

  constructor(private authService: AuthService, private ngZone: NgZone) {}

  initializeGoogleSignIn(buttonId: string) {
    // Charge et configure le bouton Google
    google.accounts.id.initialize({
      client_id: this.clientId,             
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(
      document.getElementById(buttonId),
      { theme: 'outline', size: 'large' }  // Style du bouton
    );

    google.accounts.id.prompt(); // Affiche le prompt automatiquement
  }

  private handleCredentialResponse(response: any) {
    // response.credential contient le token JWT de Google
    // Appelle ton backend via AuthService pour login avec token Google
    this.ngZone.run(() => {
      this.authService.loginWithGoogle(response.credential).subscribe({
        next: (user) => {
          console.log('Utilisateur connecté via Google:', user);
          // Ici tu peux rediriger vers dashboard ou autre
        },
        error: (err) => {
          console.error('Erreur login Google:', err);
        }
      });
    });
  }
  signInWithGoogle(): Observable<any> {
    return new Observable((observer) => {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          this.ngZone.run(() => {
            this.authService.loginWithGoogle(response.credential).subscribe({
              next: (user) => {
                observer.next(user);
                observer.complete();
              },
              error: (err) => {
                observer.error(err);
              }
            });
          });
        }
      });
      google.accounts.id.prompt();
    });
  }
 
}
