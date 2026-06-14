import {Component, inject, OnInit, signal} from '@angular/core';
import {MatFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {BuildingService} from '../../services/building.service';
import {Building} from '../../model/building.model';
import {BuildingCard} from '../building-card/building-card';

@Component({
  selector: 'app-building-list',
  imports: [
    MatFabButton,
    MatIcon,
    BuildingCard

  ],
  templateUrl: './building-list.html',
  styleUrl: './building-list.css',
})
export class BuildingList implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly buildingService = inject(BuildingService);

  readonly buildings = signal<Building[]>([]);

  ngOnInit() {
    this.buildingService.getBuildings().subscribe({
      next: buildings => {
        this.buildings.set(buildings);
      },
      error: err => {
        console.error('Failed to load buildings:', err);
      }
    });
  }

  buildingModel = signal<Building>({
    id: '',
    name: '',
    category: '',
    description: '',
    coordinates: [0, 0]
  });


  onCreate() {
    this.router.navigateByUrl('/create');
  }

  // onSelect(buildingId: string) {
  //   if (this.buildings().includes(buildingId)) {
  //     this.buildings.set(this.buildings().filter((id) => id !== buildingId));
  //   } else {
  //     this.buildings.set([...this.buildings(), buildingId]);
  //   }
  // }


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
