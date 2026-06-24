import {Component, input, output} from '@angular/core';
import {BuildingPoint} from '../../model/building.point.model';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';
import {BuildingPolygon} from '../../model/building.polygon.model';

@Component({
  selector: 'app-building-card',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatCardContent
  ],
  templateUrl: './building-card.html',
  styleUrl: './building-card.css',
})
export class BuildingCard {
  readonly building = input.required<BuildingPoint | BuildingPolygon>();

  selectAction = output<string>();

  //This is used to highlight the building on the map if we select it from the list
  readonly selected = input<boolean>(false);

  onSelect() {
    if (!this.building().id) return;
    this.selectAction.emit(this.building().id!);
  }
}
