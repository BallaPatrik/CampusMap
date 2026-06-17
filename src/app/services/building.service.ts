import {inject, Injectable} from '@angular/core';
import {BuildingPoint} from '../model/building.point.model';
import {RequestService} from './request.service';
import {forkJoin, map, Observable} from 'rxjs';
import {Position} from 'geojson';
import {BuildingPolygon} from '../model/building.polygon.model';

const BUILDING_URL = 'http://localhost:3000/buildings';

//Add a type for the building feature
type BuildingPointFeature = {
  id: string;
  type: 'Feature';
  properties: {
    name: string;
    category: string;
    description: string;
  };
  geometry: {
    type: 'Point';
    coordinates: Position;
  };
};

type BuildingPolygonFeature = {
  id: string;
  type: 'Feature';
  properties: {
    name: string;
    category: string;
    description: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: Position[][];
  };
};

@Injectable({
  providedIn: 'root',
})
export class BuildingService {
  private readonly requestService = inject(RequestService);

  getBuildings(): Observable<(BuildingPoint | BuildingPolygon)[]> {
    return forkJoin({
      points: this.getBuildingsPoint(),
      polygons: this.getBuildingsPolygon()
    }).pipe(
      map(({points, polygons}) => [
        ...points,
        ...polygons
      ])
    );
  }

  getBuildingsPolygon(): Observable<BuildingPolygon[]> {
    return this.requestService.get<BuildingPolygonFeature[]>(BUILDING_URL).pipe(
      map(features =>
        features
          .filter(f => f.geometry.type === 'Polygon')
          .map(feature => ({
            id: feature.id,
            name: feature.properties.name,
            category: feature.properties.category,
            description: feature.properties.description,
            coordinates: feature.geometry.coordinates
          }))
      )
    );
  }

  getBuildingsPoint(): Observable<BuildingPoint[]> {
    return this.requestService.get<BuildingPointFeature[]>(BUILDING_URL).pipe(
      map(features =>
        features
          .filter(f => f.geometry.type === 'Point')
          .map(feature => ({
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
    return this.requestService.get<BuildingPointFeature[]>(BUILDING_URL).pipe(
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

  createBuilding(building: BuildingPoint) {
    //Construct the building feature without the id (omit)
    const buildingPointFeature: Omit<BuildingPointFeature, 'id'> = {
      type: 'Feature',
      properties: {
        name: building.name,
        category: building.category,
        description: building.description
      },
      geometry: {
        type: 'Point',
        coordinates: building.coordinates as Position
      }
    };

    //Send a POST request to the server with the building feature
    return this.requestService.post<BuildingPointFeature>(BUILDING_URL, buildingPointFeature).pipe(
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
    return this.requestService.delete<BuildingPoint>(`${BUILDING_URL}/${buildingId}`);
  }
}
