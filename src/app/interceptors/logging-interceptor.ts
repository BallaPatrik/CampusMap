import {HttpErrorResponse, HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import {tap} from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(
    `[HTTP Request] ${req.method} ${req.urlWithParams} , with authorization: ${req.headers.get(
      'Authorization'
    )}`,
    req
  );

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`[HTTP Response] ${req.method} ${req.urlWithParams}`, event);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error(`[HTTP Error] ${req.method} ${req.urlWithParams}`, error);
      },
    })
  );
};
