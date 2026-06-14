import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);

  get<T>(url: string, options: Record<string, unknown> = {}): Observable<T> {
    return this.http.get<T>(url, options).pipe(catchError((error) => this.handleError(error)));
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
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong
      const body =
        typeof error.error === 'string'
          ? error.error
          : JSON.stringify(error.error, null, 2);

      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${body}`
      );

      console.error('Full HTTP error:', error);
    }

    // return an observable with a user-facing error message
    return throwError(() => 'Something bad happened; please try again later.');
  };

}
