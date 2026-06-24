import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {BuildingService} from '../../services/building.service';
import {BuildingPoint} from '../../model/building.point.model';
import {BuildingCard} from '../building-card/building-card';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BuildingSearchPipe} from '../../pipes/building.search.pipe';
import {forkJoin, take} from 'rxjs';
import {BuildingPolygon} from '../../model/building.polygon.model';

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

  //This is needed for highlighting buildings on the map
  selectedBuildingIdsChange = output<string[]>();

  //This is needed highlighting buildings on the map when we select them from the list
  selectedBuildingIdsFromMap = input<string[]>([]);

  allBuildingsPoint = signal<BuildingPoint[]>([]);
  allBuildingsPolygon = signal<BuildingPolygon[]>([]);
  allBuildings = computed(() => [
    ...this.allBuildingsPoint(),
    ...this.allBuildingsPolygon()
  ]);

  ngOnInit() {
    this.getAllBuildings();
  }

  searchString = signal<string>('');

  onCreate() {
    this.router.navigateByUrl('/api/building/create');
  }

  //we can derive the form's state with computed fields
  selectedBuildingCount = computed(() => this.selectedBuildingIdsFromMap().length);

  selectedBuildingIds = signal<string[]>([]);

  isBuildingSelected(buildingId: string | undefined) {
    //Helper function to check if a building is selected

    if (!buildingId) {
      return false;
    }

    return this.selectedBuildingIdsFromMap().includes(buildingId);
  }

  onSelect(buildingId: string) {
    //This handles the selection of the building

    const currentSelectedBuildingIds = this.selectedBuildingIdsFromMap();

    //This part handles when we remove the building from the selection
    //If the building is already selected, we remove it from the selection
    if (currentSelectedBuildingIds.includes(buildingId)) {
      this.selectedBuildingIds.set(
        //We filter out everything else but the buildingId from the array,
        //and we set the new array to the filtered array.
        currentSelectedBuildingIds.filter(id => id !== buildingId)
      );
    }
      //This part handles when we add the building to the selection
    //If the building is NOT selected, we add it from the selection
    else {
      this.selectedBuildingIds.set([
        ...currentSelectedBuildingIds,
        buildingId]);
    }
    //Emit the new selection
    this.selectedBuildingIdsChange.emit(this.selectedBuildingIds());
  }

  onDeleteMany() {
    let selectedBuildingIds = this.selectedBuildingIdsFromMap();
    let selectedBuildingNames = selectedBuildingIds.map(
      buildingId => this.allBuildings().find(building => building.id === buildingId)?.name);

    forkJoin(selectedBuildingIds.map((buildingId) =>
      this.buildingService.deleteBuildingById(buildingId)))
      .pipe(take(1))
      .subscribe(() => {
        this.getAllBuildings();
      });
    this.messageService.SendSuccessMessageSnackbar('Successfully deleted buildings: '
      + selectedBuildingNames + '!', 'X');
    this.selectedBuildingIds.set([]);
    //Emit the new selection
    this.selectedBuildingIdsChange.emit(this.selectedBuildingIds());
  }

  onEdit() {
    let selectedBuildingIds = this.selectedBuildingIdsFromMap();
    this.router.navigateByUrl('/api/building/edit/' + selectedBuildingIds[0]);
  }

  getAllBuildings() {
    this.buildingService.getBuildingsPoint().subscribe({
      next: buildings => {
        this.allBuildingsPoint.set(buildings);
      },
      error: err => {
        console.error('Failed to load point buildings:', err);
      }
    });
    this.buildingService.getBuildingsPolygon().subscribe({
      next: buildings => {
        this.allBuildingsPolygon.set(buildings);
      },
      error: err => {
        console.error('Failed to load polygon buildings:', err);
      }
    });
  }

}
