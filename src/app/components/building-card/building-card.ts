import {Component, input, output} from '@angular/core';
import {Building} from '../../model/building.model';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';

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
  readonly building = input.required<Building>();

  selectAction = output<string>();

  onSelect() {
    if (!this.building().id) return;
    this.selectAction.emit(this.building().id!);
  }
}
