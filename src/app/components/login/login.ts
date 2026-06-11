import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { LocalStorageKeys } from '../../constants/local-storage-keys';
import { Router } from '@angular/router';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';
import {MessageService} from '../../services/message.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatFormField, MatLabel, MatInput, FormsModule, FormField ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService=inject(MessageService)


  ngOnInit() {
    if (localStorage.getItem(LocalStorageKeys.TOKEN) !== null) {
      this.router.navigateByUrl('/map');
    }
  }

  onLogin(name: string, password: string) {
    this.authService.login(name, password)
      .subscribe((token) => {
        if (token) {
          localStorage.setItem(LocalStorageKeys.TOKEN, token);
          this.messageService.SuccessMessageSnackbar('Login Successful!', 'Close');
          this.router.navigateByUrl('/map');
        } else {
          this.messageService.ErrorMessageSnackbar('Wrong email or password!', 'Close');
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
