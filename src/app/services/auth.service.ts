import {inject, Injectable} from '@angular/core';
import {map, take} from 'rxjs';
import {RequestService} from './request.service';
import {User} from '../model/user.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockJwtToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

  private readonly requestService =inject(RequestService);

  login(name : string, password : string) {
    return this.requestService
      //Send a get request to the JSON server to get the users
      .get<User[]>('http://localhost:3000/people')

      .pipe(
        //Take the 1st response
        take(1),
        //We want to map the response to a JWT token
        map((users) => {
          //Check if the user exists in the database
          const matchingUser = users.find(
            (user) => user.name === name && user.password === password
          );
          //If the user exists, return a JWT token, otherwise return null
          return matchingUser ? this.mockJwtToken : null;
        })
      );
  }
}
