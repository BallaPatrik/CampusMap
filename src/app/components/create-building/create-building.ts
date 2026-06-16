import {Component, inject, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatError, MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {Building} from '../../model/building.model';
import {BuildingService} from '../../services/building.service';

@Component({
  selector: 'app-create-building',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    FormField
  ],
  templateUrl: './create-building.html',
  styleUrl: './create-building.css',
})
export class CreateBuilding {
  private readonly router = inject(Router);
  private readonly buildingService = inject(BuildingService);
  private readonly messageService = inject(MessageService);

  onCreate() {
    const building: Building = {
      ...this.buildingModel()
    };
    this.buildingService.createBuilding(building)
      .subscribe((building) => {
      });
    this.messageService.SendSuccessMessageSnackbar('Successfully created building: ' + building.name + '!', 'X');
    this.router.navigateByUrl('/api/map');
  }

  //we specify the form model and the initial state as a signal
  buildingModel = signal<Building>({
    name: '',
    category: '',
    description: '',
    coordinates: [17.9, 47]
  });


  //calling the new form() function creates a signal form based on the model and the declared schemaPath configuration
  createBuildingForm = form(this.buildingModel, (schemaPath) => {
    //there are builtin validators like required, minLength, pattern etc.
    required(schemaPath.name);
    required(schemaPath.category);
    required(schemaPath.description);


    //required(schemaPath.coordinates);


    //we can define are own reusable validators too
    //recipeCodeValidator(schemaPath.recipeCode);
    minLength(schemaPath.name, 4);
    minLength(schemaPath.category, 4);
    minLength(schemaPath.description, 10);

    //differentValidator(schemaPath.name, [schemaPath.description]);
  });

  getNameErrorMessage() {
    const name = this.createBuildingForm.name();

    if (name.dirty() || name.touched()) {
      const errors = name.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for name!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 4 characters for name!';
      }
    }
    return '';
  }

  getCategoryErrorMessage() {
    const category = this.createBuildingForm.category();

    if (category.dirty() || category.touched()) {
      const errors = category.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for category!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 4 characters for category!';
      }
    }
    return '';
  }

  getDescriptionErrorMessage() {
    const description = this.createBuildingForm.description();

    if (description.dirty() || description.touched()) {
      const errors = description.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for description!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 10 characters for description!';
      }
    }
    return '';
  }

  getCoordinatesErrorMessage() {
    const password = this.createBuildingForm.category();

    if (password.dirty() || password.touched()) {
      const errors = password.errors();

      if (errors.some(error => error.kind === 'required')) {
        return 'You must enter a value for coordinates!';
      }

      if (errors.some(error => error.kind === 'minLength')) {
        return 'You must enter at least 4 characters for coordinates!';
      }
    }
    return '';
  }
}
