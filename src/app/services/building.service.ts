import {inject, Injectable} from '@angular/core';
import {Building} from '../model/building.model';
import {RequestService} from './request.service';
import {map, Observable} from 'rxjs';

const BUILDING_URL = 'http://localhost:3000/buildings';

//Add a type for the building feature
type BuildingFeature = {
  id: string;
  type: 'Feature';
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
    //Construct the building feature without the id (omit)
    const buildingFeature: Omit<BuildingFeature, 'id'> = {
      type: 'Feature',
      properties: {
        name: building.name,
        category: building.category,
        description: building.description
      },
      geometry: {
        type: 'Point',
        coordinates: building.coordinates
      }
    };

    //Send a POST request to the server with the building feature
    return this.requestService.post<BuildingFeature>(BUILDING_URL, buildingFeature).pipe(
      //Map because we only need parts of the response
      map(feature => ({
        id: feature.id,
        name: feature.properties.name,
        category: feature.properties.category,
        description: feature.properties.description,
        coordinates: feature.geometry.coordinates
      }))
    );
  }

  deleteBuildingById(buildingId: string) {
    return this.requestService.delete<Building>(`${BUILDING_URL}/${buildingId}`);
  }
}
