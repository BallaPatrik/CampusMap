import {inject, Injectable} from '@angular/core';
import {map, Observable, of, switchMap, take, tap} from 'rxjs';
import {RequestService} from './request.service';
import {User} from '../model/user.model';
import {LocalStorageKeys} from '../constants/local-storage-keys';


@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly mockJwtToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

  private readonly requestService = inject(RequestService);

  login(name: string, password: string) {
    return this.requestService
      //Send a get request to the JSON server to get the users
      .get<User[]>('http://localhost:3000/people')
      .pipe(
        //Take the 1st response
        take(1),
        //We want to use switchMap (switch to new requests if a new request is made)
        switchMap((users) => {
          //Check if the user exists in the database
          const matchingUser = users.find(
            (user) => user.name === name && user.password === password
          );
          //If the user exists
          if (matchingUser) {
            //Set the isLoggedIn property to true
            matchingUser.isLoggedIn = true;
            const id = matchingUser.id;
            //Send a put request to the JSON server to update the user
            return this.requestService
              .put<User>(`http://localhost:3000/people/${id}`, matchingUser)
              .pipe(
                //Map the response to the JWT token and also set the current user
                map((updatedUser) => {
                  this.setCurrentUser(updatedUser);
                  return this.mockJwtToken;
                })
              );
          }
          //If the user doesn't exist, return an observable with a null value
          return of(null);
        })
      );
  }

  logout(): Observable<User | null> {
    const currentUser = this.getCurrentUser();

    //We need this check because the id can be 0 (? because it can be undefined)
    const currentUserExists=currentUser?.id!==undefined;

    //If the user doesn't exist, return an observable with a null value
    if (!currentUserExists) {
      return of(null);
    }

    //We need to update the user in the database to set isLoggedIn to false
    const updatedUser: User = {
      ...currentUser,
      isLoggedIn: false,
    };

    //Send a put request to the JSON server to update the user
    return this.requestService
      .put<User>(`http://localhost:3000/people/${updatedUser.id}`, updatedUser)
      .pipe(
        //Remove the current user from local storage and return the updated user
        tap(() => {
          localStorage.removeItem('currentUser');
          localStorage.removeItem(LocalStorageKeys.TOKEN);
        })
      );
  }

  setCurrentUser(user: User) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  }
}
