import {Pipe, PipeTransform} from '@angular/core';
import {BuildingPoint} from '../model/building.point.model';
import {BuildingPolygon} from '../model/building.polygon.model';


//pipes are used to modify data, we can use it in template with | operator plus we can also inject it and use it in code
//here we implemented a search by name for recipes
@Pipe({
  name: 'buildingSearch',
})
export class BuildingSearchPipe implements PipeTransform {
  transform(buildings: (BuildingPoint | BuildingPolygon)[], searchString: string | null): (BuildingPoint | BuildingPolygon)[] {
    if (!searchString || searchString.length === 0) return buildings;

    return buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(searchString.toLowerCase()) ||
        building.description.toLowerCase().includes(searchString.toLowerCase()) ||
        building.category.toLowerCase().includes(searchString.toLowerCase())
    );
  }
}
