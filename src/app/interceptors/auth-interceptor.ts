import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {LocalStorageKeys} from '../constants/local-storage-keys';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, throwError} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(LocalStorageKeys.TOKEN);
  const router = inject(Router);

  let modifiedReq = req;

  //If the token exists, add Authorization header to the request
  if (token) {
    modifiedReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${token}`),
    });
    return next(modifiedReq);
  }

  //If the token doesn't exist
  return next(modifiedReq).pipe(
    //Check if the response status is 401 (Unauthorized)
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        //If it is, remove the token from local storage and redirect to the login page
        localStorage.removeItem(LocalStorageKeys.TOKEN);
        router.navigateByUrl('/api/login');
      }

      return throwError(() => error);
    })
  );
};
