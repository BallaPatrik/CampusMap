//using ngrx store we worked with state observables transformed to signals in the component code
//with ngrx signals we store state in signals, this way we can enjoy all of the convenient features angular offers for signals

import {User} from '../model/user.model';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {exhaustMap, pipe} from 'rxjs';
import {tapResponse} from '@ngrx/operators';
import {LocalStorageKeys} from '../constants/local-storage-keys';
import {MessageService} from '../services/message.service';

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

//we create a signal store with the signalStore method, it can be injected like a class, plus we need to declare the initial state of it
export const AuthStore = signalStore(
  {providedIn: 'root'},
  withDevtools('recipe'),
  withState(initialState),
  //we can also define computed fields, which returns the state transformed in our own way
  // withComputed(({ selectedRecipes }) => ({
  //   selectedRecipesCount: computed(() => selectedRecipes().length),
  // })),
  //we can also define methods, which will mutate the immutable state of our store using patchState method
  withMethods((store,
               authService = inject(AuthService),
               router = inject(Router),
               messageService = inject(MessageService)) => {
    //to work async logic such as API calls we use rxMethod()
    const login = rxMethod<{ name: string, password: string }>(
      pipe(
        exhaustMap(({name, password}) =>
          authService.login(name, password).pipe(
            tapResponse({
              next: (token) => {
                if (token) {
                  localStorage.setItem(LocalStorageKeys.TOKEN, token);

                  patchState(store, {
                    token,
                    user: authService.getCurrentUser(),
                  });
                  messageService.SendSuccessMessageSnackbar('Login Successful!', 'X');
                  router.navigateByUrl('/api/map');
                } else {
                  patchState(store, {
                    token: null,
                    user: null,
                  });

                  messageService.SendErrorMessageSnackbar('Wrong email or password!', 'X');
                }
              },
              error: () => {
                console.error('Error while logging in');
              },
            })
          )
        )
      )
    );

    const logout = rxMethod<void>(
      pipe(
        exhaustMap(() =>
          authService.logout().pipe(
            tapResponse({
              next: () => {
                router.navigateByUrl('');
                messageService.SendSuccessMessageSnackbar('Logout Successful!', 'X');
              },
              error: () => {
                console.error('Error while logging out!');
              },
            })
          )
        )
      )
    );

    return {
      login,
      logout
    };
  })
);
