import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {LoadingService} from '../services/loading.service';
import {finalize} from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {

  const loadingService = inject(LoadingService);

  //At the start of the request, show the spinner
  loadingService.loadingOn();

  //At the end of the request, hide the spinner
  return next(req).pipe(
    //We can see the spinner if we wait for 2 seconds,
    //otherwise it will be visible for a short time
    //delay(2000),
    finalize(() => loadingService.loadingOff())
  );
};
