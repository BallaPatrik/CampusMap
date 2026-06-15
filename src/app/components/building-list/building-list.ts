import {Component, inject, OnInit, signal} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {BuildingService} from '../../services/building.service';
import {Building} from '../../model/building.model';
import {BuildingCard} from '../building-card/building-card';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BuildingSearchPipe} from '../../pipes/building.search.pipe';

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

  readonly allBuildings = signal<Building[]>([]);

  ngOnInit() {
    this.buildingService.getBuildings().subscribe({
      next: buildings => {
        this.allBuildings.set(buildings);
      },
      error: err => {
        console.error('Failed to load buildings:', err);
      }
    });
  }

  buildingInitialValue = signal<Building>({
    id: '',
    name: '',
    category: '',
    description: '',
    coordinates: [0, 0]
  });

  searchString = signal<string>('');

  onCreate() {
    this.router.navigateByUrl('/create');
  }

  readonly selectedBuildingIds = signal<string[]>([]);

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


  // onDeleteMany() {
  //   forkJoin(this.selectedRecipes().map((recipeId) => this.recipeService.deleteRecipe(recipeId)))
  //     .pipe(take(1))
  //     .subscribe(() => {
  //       alert('Successfully deleted!');
  //       this.recipes$ = this.recipeService.getRecipes();
  //     });
  //
  //   this.selectedRecipes.set([]);
  // }

}
