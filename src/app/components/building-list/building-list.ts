import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {BuildingService} from '../../services/building.service';
import {Building} from '../../model/building.model';
import {BuildingCard} from '../building-card/building-card';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BuildingSearchPipe} from '../../pipes/building.search.pipe';
import {forkJoin, take} from 'rxjs';

@Component({
  selector: 'app-building-list',
  imports: [
    MatFabButton,
    MatIcon,
    BuildingCard,
    ReactiveFormsModule,
    FormsModule,
    BuildingSearchPipe
  ],
  templateUrl: './building-list.html',
  styleUrl: './building-list.css',
})
export class BuildingList implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly buildingService = inject(BuildingService);

  allBuildings = signal<Building[]>([]);

  ngOnInit() {
    this.getAllBuildings();
  }

  searchString = signal<string>('');

  onCreate() {
    this.router.navigateByUrl('/create');
  }

  //we can derive the form's state with computed fields
  selectedBuildingCount = computed(() => this.selectedBuildingIds().length);

  selectedBuildingIds = signal<string[]>([]);

  onSelect(buildingId: string) {
    //This handles the selection of the building

    //This part handles when we remove the building from the selection
    //If the building is already selected, we remove it from the selection
    if (this.selectedBuildingIds().includes(buildingId)) {
      this.selectedBuildingIds.set(
        //We filter out everything else but the buildingId from the array,
        //and we set the new array to the filtered array.
        this.selectedBuildingIds().filter(id => id !== buildingId)
      );
    }
      //This part handles when we add the building to the selection
    //If the building is NOT selected, we add it from the selection
    else {
      this.selectedBuildingIds.set([
        ...this.selectedBuildingIds(),
        buildingId]);
    }
  }

  onDeleteMany() {
    let selectedBuildingIds = this.selectedBuildingIds();
    let selectedBuildingNames = selectedBuildingIds.map(
      buildingId => this.allBuildings().find(building => building.id === buildingId)?.name);

    forkJoin(this.selectedBuildingIds().map((buildingId) =>
      this.buildingService.deleteBuildingById(buildingId)))
      .pipe(take(1))
      .subscribe(() => {
        this.getAllBuildings();
      });
    this.messageService.SendSuccessMessageSnackbar('Successfully deleted buildings: ' + selectedBuildingNames + '!', 'X');
    this.selectedBuildingIds.set([]);
  }

  getAllBuildings() {
    this.buildingService.getBuildings().subscribe({
      next: buildings => {
        this.allBuildings.set(buildings);
      },
      error: err => {
        console.error('Failed to load buildings:', err);
      }
    });
  }

}
