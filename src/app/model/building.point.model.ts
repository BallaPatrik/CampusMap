import {Position} from 'geojson';

export interface BuildingPoint {
  id?: string;
  name: string;
  category: string;
  description: string;
  coordinates: Position;
  userId: number;
  isItPublic: boolean;
}

