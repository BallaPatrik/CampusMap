import {inject} from '@angular/core';
import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {throwError} from 'rxjs';
import {AuthService} from '../services/auth.service';

interface BuildingRequestBody {
  properties?: {
    userId?: number;
  };
}

function hasBuildingProperties(body: unknown): body is BuildingRequestBody {
  // Check if the body is an object and has a 'properties' property
  return typeof body === 'object' && body !== null && 'properties' in body;
}

export const buildingOwnershipInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  //Check if a request is for a building and if it is an update request
  const isBuildingUpdate = req.url.includes('/building')
    && (req.method === 'POST' || req.method === 'PUT'
      || req.method === 'PATCH' || req.method === 'DELETE');

  //If it is not an update request, just return the request
  if (!isBuildingUpdate) {
    return next(req);
  }

  //Get the current user id and the body of the request
  const currentUserId = authService.getCurrentUserId();
  const body = req.body as BuildingRequestBody;

  //If the body doesn't have a properties object or the userId property is undefined, just return the request
  if (!hasBuildingProperties(body) || body.properties?.userId === undefined) {
    return next(req);
  }

  //If the user id in the body doesn't match the current user id (the building request is not his/hers), throw an error
  if (body.properties.userId !== currentUserId) {
    return throwError(() => new HttpErrorResponse({
      status: 403,
      error: 'Forbidden - Not owner of building'
    }));
  }

  //If the user id in the body matches the current user id (the building request is his/hers), just return the request
  return next(req);
};
