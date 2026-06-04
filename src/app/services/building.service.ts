import { inject, Injectable } from '@angular/core';
import {Building} from '../model/building.model';
import {RequestService} from './request.service';

const BUILDING_URL = 'api/building';

@Injectable()
export class BuildingService {
  private readonly requestService = inject(RequestService);

  getBuildings() {
    return this.requestService.get<Building[]>(BUILDING_URL);
  }

  getBuildingById(buildingId: Building) {
    return this.requestService.get<Building>(`${BUILDING_URL}/${buildingId}`);
  }

  createBuilding(building: Building) {
    return this.requestService.post<Building>(`${BUILDING_URL}`, building);
  }

  deleteBuilding(buildingId: number) {
    return this.requestService.delete<Building>(`${BUILDING_URL}/${buildingId}`);
  }
}
