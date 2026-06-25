import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {catchError, Observable, throwError} from 'rxjs';
import {MessageService} from './message.service';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  get<T>(url: string, options: Record<string, unknown> = {}): Observable<T> {
    return this.http.get<T>(url, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  post<T>(url: string, body: any, options: Record<string, unknown> = {}): Observable<T> {
    return this.http
      .post<T>(url, body, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  put<T>(url: string, body: any, options: Record<string, unknown> = {}): Observable<T> {
    return this.http
      .put<T>(url, body, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  delete<T>(url: string, options: Record<string, unknown> = {}): Observable<T> {
    return this.http.delete<T>(url, options).pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      this.messageService.SendErrorMessageSnackbar('An error occurred:' + error.error.message, 'X');
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong
      const body =
        typeof error.error === 'string'
          ? error.error
          : JSON.stringify(error.error, null, 2);

      this.messageService.SendErrorMessageSnackbar(
        `Backend returned code ${error.status}, ` + `body was: ${body}`, 'X');

      this.messageService.SendErrorMessageSnackbar('Full HTTP error:' + error, 'X');
    }

    if (error.status === 403) {
      this.messageService.SendErrorMessageSnackbar('You are not authorized to perform this action!', 'X');
      return throwError(() => 'You are not authorized to perform this action!');
    }

    // return an observable with a user-facing error message
    this.messageService.SendErrorMessageSnackbar('Something bad happened; please try again later.', 'X');
    return throwError(() => 'Something bad happened; please try again later.');
  };

}
