import {CanActivateFn, Router} from '@angular/router';
import {LocalStorageKeys} from '../constants/local-storage-keys';
import {inject} from '@angular/core';

//we can define guards to add logic for angular routing
//there are several guard types, the most basic is CanActive which tells if we can route to a path or not
//here if we are not logged in we cannot route to the path, otherwise we can
export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem(LocalStorageKeys.TOKEN);

  if (token) {
    return true;
  }

  router.navigateByUrl('/api/login');
  return false;
};
