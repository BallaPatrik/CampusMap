import {inject, Injectable} from '@angular/core';
import {Building} from '../model/building.model';
import {RequestService} from './request.service';
import {map, Observable} from 'rxjs';

const BUILDING_URL = 'http://localhost:3000/buildings';

//Add a type for the building feature
type BuildingFeature = {
  id: string;
  properties: {
    name: string;
    category: string;
    description: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

@Injectable({
  providedIn: 'root',
})
export class BuildingService {
  private readonly requestService = inject(RequestService);

  getBuildings(): Observable<Building[]> {
    return this.requestService.get<BuildingFeature[]>(BUILDING_URL).pipe(
      //Map the response, because we need parts of the response
      map(features =>
        //Iterate over the features and return a new array of buildings
        features.map(feature => ({
          id: feature.id,
          name: feature.properties.name,
          category: feature.properties.category,
          description: feature.properties.description,
          coordinates: feature.geometry.coordinates
        }))
      )
    );
  }

  getBuildingById(buildingId: string) {
    return this.requestService.get<BuildingFeature[]>(BUILDING_URL).pipe(
      //Map the response, because we need parts of the response
      map(features => {
        //Find the building with the given id
        const feature = features.find(f => f.id === buildingId);

        //If the building is not found, return undefined
        if (!feature) {
          return undefined;
        }

        //Else return the building
        return {
          id: feature.id,
          name: feature.properties.name,
          category: feature.properties.category,
          description: feature.properties.description,
          coordinates: feature.geometry.coordinates
        };
      })
    );
  }

  createBuilding(building: Building) {
    return this.requestService.post<Building>(`${BUILDING_URL}`, building);
  }

  deleteBuildingById(buildingId: string) {
    return this.requestService.delete<Building>(`${BUILDING_URL}/${buildingId}`);
  }
}
