import {Component, inject, OnInit, signal} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { LocalStorageKeys } from '../../constants/local-storage-keys';
import { Router } from '@angular/router';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {Field, form, minLength, required} from '@angular/forms/signals';
import {User} from '../../model/user.model';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatFormField, MatLabel, Field, MatInput, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit{
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  ngOnInit() {
    if (localStorage.getItem(LocalStorageKeys.TOKEN) !== null) {
      this.router.navigateByUrl('/map');
    }
  }

  onLogin(name: string, password: string) {
    this.authService
      .login(name, password)
      .subscribe((token) => {
        if (token) {
          localStorage.setItem(LocalStorageKeys.TOKEN, token);
          this.router.navigateByUrl('/map');
        }
      });
  }
  //we specify the form model and the initial state as a signal
  personModel = signal<User>({
    name: '',
    password: '',
    isLoggedIn: false,
  });

  //calling the new form() function creates a signal form based on the model and the declared schemaPath configuration
  loginForm = form(this.personModel, (schemaPath) => {
    //there are builtin validators like required, minLength, pattern etc.
    required(schemaPath.name);
    required(schemaPath.password);
    //we can define are own reusable validators too
    //recipeCodeValidator(schemaPath.recipeCode);
    minLength(schemaPath.name, 4);
    minLength(schemaPath.password, 4);
    //differentValidator(schemaPath.name, [schemaPath.description]);
  });
}
