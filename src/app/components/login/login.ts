import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { LocalStorageKeys } from '../../constants/local-storage-keys';
import { take } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  onLogin() {
    this.authService
      .login()
      .pipe(take(1))
      .subscribe((token) => {
        localStorage.setItem(LocalStorageKeys.TOKEN, token);
        this.router.navigateByUrl('');
      });
  }
}
