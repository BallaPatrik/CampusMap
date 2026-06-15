import {Pipe, PipeTransform} from '@angular/core';
import {Building} from '../model/building.model';


//pipes are used to modify data, we can use it in template with | operator plus we can also inject it and use it in code
//here we implemented a search by name for recipes
@Pipe({
  name: 'buildingSearch',
})
export class BuildingSearchPipe implements PipeTransform {
  transform(buildings: Building[], searchString: string | null): Building[] {
    if (!searchString || searchString.length === 0) return buildings;

    return buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(searchString.toLowerCase()) ||
        building.description.toLowerCase().includes(searchString.toLowerCase()) ||
        building.category.toLowerCase().includes(searchString.toLowerCase())
    );
  }
}
