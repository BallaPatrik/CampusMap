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

  getBuildingById(buildingId: number) {
    return this.requestService.get<Building>(`${BUILDING_URL}/${buildingId}`);
  }

  createBuilding(building: Building) {
    return this.requestService.post<Building>(`${BUILDING_URL}`, building);
  }

  deleteBuildingById(buildingId: number) {
    return this.requestService.delete<Building>(`${BUILDING_URL}/${buildingId}`);
  }
}
