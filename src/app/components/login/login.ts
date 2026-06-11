import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { LocalStorageKeys } from '../../constants/local-storage-keys';
import { Router } from '@angular/router';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';
import {MessageService} from '../../services/message.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatFormField, MatLabel, MatInput, FormsModule, FormField, MatError],
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
          this.messageService.SendSuccessMessageSnackbar('Login Successful!', 'X');
          this.router.navigateByUrl('/map');
        } else {
          this.messageService.SendErrorMessageSnackbar('Wrong email or password!', 'X');
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

  getNameErrorMessage() {
    const name = this.loginForm.name();

    if (name.dirty() || name.touched()) {
      const errors=name.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for name!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 4 characters for name!';
      }
    }
    return '';
  }

  getPasswordErrorMessage(){
    const password = this.loginForm.password();

    if (password.dirty() || password.touched()) {
      const errors=password.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for password!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 4 characters for password!';
      }
    }
    return '';
  }
}
