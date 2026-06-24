import {Component, inject, input, output} from '@angular/core';
import {BuildingPoint} from '../../model/building.point.model';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';
import {BuildingPolygon} from '../../model/building.polygon.model';
import {EditBuilding} from '../../directives/edit-building';
import {Router} from '@angular/router';

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

  readonly building = input.required<BuildingPoint | BuildingPolygon>();

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
}
