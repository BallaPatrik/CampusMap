import {Component, inject, input, output} from '@angular/core';
import {BuildingPoint} from '../../model/building.point.model';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';
import {BuildingPolygon} from '../../model/building.polygon.model';
import {EditBuilding} from '../../directives/edit-building';
import {Router} from '@angular/router';
import {BuildingService} from '../../services/building.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-building-card',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatCardContent,
    EditBuilding
  ],
  templateUrl: './building-card.html',
  styleUrl: './building-card.css',
})
export class BuildingCard {
  protected readonly router = inject(Router);
  protected readonly buildingService = inject(BuildingService);
  protected readonly authService = inject(AuthService);
  protected building = input.required<BuildingPoint | BuildingPolygon>();

  selectAction = output<string>();

  //This is used to highlight the building on the map if we select it from the list
  readonly selected = input<boolean>(false);

  onSelect() {
    if (!this.building().id) return;
    this.selectAction.emit(this.building().id!);
  }

  protected onEdit() {
    this.router.navigateByUrl('/api/building/edit/' + this.building().id!);
  }


  private isPolygon(
    building: BuildingPoint | BuildingPolygon
  ): building is BuildingPolygon {
    //Helper function to check if a building is a polygon or not
    return Array.isArray(building.coordinates[0]);
  }

  onPublicChanged(isPublic: boolean) {

    //Update the building's isItPublic property'
    const updatedBuilding = {
      ...this.building(),
      isItPublic: isPublic
    };

    //If the building is a polygon, we use the editPolygonBuilding method
    if (this.isPolygon(updatedBuilding)) {
      this.buildingService.editPolygonBuilding(updatedBuilding).subscribe({});
    }
    //Otherwise, we use the editPointBuilding method
    else {
      this.buildingService.editPointBuilding(updatedBuilding).subscribe({});
    }
  }
}
