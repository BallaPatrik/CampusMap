import {Component, inject, OnInit, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatError, MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {Router} from '@angular/router';
import {MessageService} from '../../services/message.service';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {BuildingService} from '../../services/building.service';
import {LayerComponent, MapComponent, RasterSourceComponent} from '@maplibre/ngx-maplibre-gl';
import {IControl, Map as MapLibreMap, StyleSpecification} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import {Feature, FeatureCollection, Polygon, Position} from 'geojson';
import {BuildingPolygon} from '../../model/building.polygon.model';
import {polygonCoordinatesValidator} from '../../validators/polygon-coordinates-validator';
import {MatCheckbox} from '@angular/material/checkbox';
import {AuthService} from '../../services/auth.service';

type ActiveDrawState =
  | { kind: 'polygon'; state: any }
  | { kind: 'line'; state: any };

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
    FormField,
    LayerComponent,
    MapComponent,
    RasterSourceComponent,
    MatCheckbox
  ],
  templateUrl: './create-building.html',
  styleUrl: './create-building.css',
})
export class CreateBuilding implements OnInit {
  private readonly router = inject(Router);
  private readonly buildingService = inject(BuildingService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  protected style!: StyleSpecification;
  protected draw!: MapLibreDraw;
  private map?: MapLibreMap;

  protected selectedBuildingCoordinates = signal(<Position[][]>[[]]);

  private undoStack: Position[][][] = [];
  private redoStack: Position[][][] = [];
  private currentState = signal(<Position[][]>([]));
  private activeDrawState?: ActiveDrawState;

  private isApplyingDraftState = false;


  ngOnInit() {
    this.style = {
      version: 8,
      sources: {},
      layers: [],
    };
  }

  onMapLoad(map: MapLibreMap) {
    this.map = map;

    this.addDraw(map);

    this.clearEveryDrawing();
  }

  addDraw(map: MapLibreMap) {
    this.draw = new MapLibreDraw({
      controls: {
        polygon: true,
        trash: true,
      },
      modes: {
        ...MapLibreDraw.modes,
        draw_polygon: this.createUndoablePolygonMode(),
        draw_line_string: this.createUndoableLineMode(),
      },
    });

    map.addControl(this.draw as unknown as IControl);

    map.on('draw.create', (e) => this.onDrawEvent(e));
    map.on('draw.update', (e) => this.onDrawEvent(e));
  }

  clearDrawing() {

    //We want to clear every drawing if it exceeds one (multiple areas can't be added to a single building)
    //Get the number of drawings
    const count = this.draw.getAll().features.length;

    //If it's 1, we don't want to clear it
    if (count == 1) {
      return;
    }

    //Else we want to clear it and send an error message
    this.messageService.SendErrorMessageSnackbar("You can only draw one building at a time!", "X");

    this.clearEveryDrawing();
  }

  clearEveryDrawing() {
    //Delete all drawings
    this.draw.deleteAll();

    //Delete the undo/redo stack and set the state to []
    this.undoStack = [];
    this.redoStack = [];
    this.currentState.set([]);

    //Reset the selected building coordinates
    this.selectedBuildingCoordinates.set([]);

    //Update the model with cleared coordinates
    this.buildingPolygonModel.update(b => ({
      ...b,
      coordinates: []
    }));
  }

  onDrawEvent(e: { features: Feature<Polygon>[]; type: string }) {

    //We are updating the draw feature from code, so we don't need any
    //draw event caused by our update
    if (this.isApplyingDraftState) {
      return;
    }

    // Clear the drawings if there are more than 1 drawing(s)
    this.clearDrawing();

    //Get the coordinates
    const coordinates = e.features[0].geometry.coordinates;

    //Save the completed edit for undo/redo
    this.saveCompletedDraftState(coordinates);

    //Set it to the selected building
    this.selectedBuildingCoordinates.set(coordinates);

    //Update the model with the coordinates
    this.buildingPolygonModel.update(building => ({
      ...building,
      coordinates
    }));
  }

  private saveCompletedDraftState(coordinates: Position[][]) {

    //Get the next and current state
    const nextState = structuredClone(coordinates);
    const currentState = this.currentState();

    //If the current state and next state are equal, then return
    if (this.areCoordinatesEqual(currentState, nextState)) {
      return;
    }

    //Otherwise push the next state to the undo stack
    this.undoStack.push(nextState);
    //Reset the redo stack
    this.redoStack = [];
    //And set the current state to the next state
    this.currentState.set(nextState);
  }

  private areCoordinatesEqual(first: Position[][], second: Position[][]) {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  undo() {

    //If it's empty, then return
    if (this.undoStack.length === 0) {
      return;
    }

    //Get the current state
    const currentState = this.undoStack.pop()!;

    //Add it to the redo stack
    this.redoStack.push(currentState);

    //Get the previous state: last element of the undoStack
    const previousState = this.undoStack.at(-1) ?? [];

    //Display the changes on the map
    this.applyDraftState(previousState);
  }

  redo() {

    //If it's empty, then return
    if (this.redoStack.length === 0) {
      return;
    }

    //Get the next state
    const nextState = this.redoStack.pop()!;

    //Add it to the undo stack
    this.undoStack.push(nextState);

    //Display the changes on the map
    this.applyDraftState(nextState);
  }

  private createUndoableLineMode() {
    // Get the default MapLibre Draw line drawing mode.
    // We will wrap some of its behavior so we can save undo/redo states while drawing.
    const baseMode = MapLibreDraw.modes.draw_line_string as any;

    // Store the Angular component instance because inside MapLibre mode callbacks,
    // `this` refers to the MapLibre mode context, not the Angular component.
    const component = this;

    return {
      ...baseMode,

      // Called when the user starts drawing a line.
      onSetup(opts: any) {
        // Let the original line mode initialize its internal state first.
        const state = baseMode.onSetup.call(this, opts);

        // Save the active drawing state so undo/redo can update the draft line directly.
        component.activeDrawState = {kind: 'line', state};

        return state;
      },

      // Called when the user stops drawing a line.
      onStop(state: any) {
        // Clear the active draw state only if it belongs to this drawing session.
        if (component.activeDrawState?.state === state) {
          component.activeDrawState = undefined;
        }

        // Run the original stop behavior from MapLibre Draw.
        baseMode.onStop.call(this, state);
      },

      // Called when the user clicks on the map while drawing a line.
      clickAnywhere(state: any, e: any) {
        // Store the vertex position before the click so we can detect if a new point was added.
        const previousVertexPosition = state.currentVertexPosition;

        // Let the original line mode handle the click.
        baseMode.clickAnywhere.call(this, state, e);

        // If the vertex position changed, a new point was added, so save it for undo.
        if (state.currentVertexPosition !== previousVertexPosition) {
          component.saveDraftLineState(state);
        }
      },
    };
  }

  private createUndoablePolygonMode() {
    // Get the default MapLibre Draw polygon drawing mode.
    // We will wrap it to track polygon changes for undo/redo support.
    const baseMode = MapLibreDraw.modes.draw_polygon as any;

    // Store the Angular component instance because MapLibre callbacks use their own `this`.
    const component = this;

    return {
      ...baseMode,

      // Called when the user starts drawing a polygon.
      onSetup(opts: any) {
        // Initialize the polygon using the original MapLibre Draw setup logic.
        const state = baseMode.onSetup.call(this, opts);

        // Save the active polygon drawing state so undo/redo can modify it while drawing.
        component.activeDrawState = {kind: 'polygon', state};

        return state;
      },

      // Called when the user stops drawing a polygon.
      onStop(state: any) {
        // Clear the active draw state only if this stop event belongs to the current polygon.
        if (component.activeDrawState?.state === state) {
          component.activeDrawState = undefined;
        }

        // Run the original MapLibre Draw stop behavior.
        baseMode.onStop.call(this, state);
      },

      // Called when the user clicks on the map while drawing a polygon.
      clickAnywhere(state: any, e: any) {
        // Save the current vertex position before the click.
        const previousVertexPosition = state.currentVertexPosition;

        // Let the default polygon mode process the click and possibly add a new vertex.
        baseMode.clickAnywhere.call(this, state, e);

        // If the vertex position changed, a new polygon point was added, so save an undo state.
        if (state.currentVertexPosition !== previousVertexPosition) {
          component.saveDraftPolygonState(state);
        }
      },
    };
  }

  private saveDraftLineState(state: any) {
    // Clone the current line coordinates so later changes do not mutate the saved undo state.
    const lineCoordinates = structuredClone(state.line.coordinates) as Position[];

    // MapLibre Draw keeps an extra moving point at the end while drawing.
    // For undo/redo, save only the confirmed points.
    const coordinates = [lineCoordinates.length > 1 ? lineCoordinates.slice(0, -1) : lineCoordinates];

    // Save the current draft state to the undo stack.
    this.undoStack.push(coordinates);

    // Once a new drawing action happens, redo history is no longer valid.
    this.redoStack = [];

    // Store the current draft coordinates.
    this.currentState.set(coordinates);
  }

  private saveDraftPolygonState(state: any) {
    // Clone the current polygon coordinates so the saved state is independent
    // from MapLibre Draw's internal mutable state.
    const coordinates = structuredClone(state.polygon.coordinates) as Position[][];

    // MapLibre Draw keeps an extra moving point at the end while drawing.
    // Remove it before saving the polygon state for undo/redo.
    const outerRing = coordinates[0] ?? [];

    if (outerRing.length > 1) {
      coordinates[0] = outerRing.slice(0, -1);
    }

    // Save the current polygon draft state to the undo stack.
    this.undoStack.push(coordinates);

    // Clear redo history because a new user action creates a new edit path.
    this.redoStack = [];

    // Update the current draft state.
    this.currentState.set(coordinates);
  }

  private applyDraftState(coordinates: Position[][]) {
    // Clone the coordinates so applying the state does not accidentally mutate
    // the stored undo/redo data.
    const nextCoordinates = structuredClone(coordinates);

    // Update the currently tracked draft state.
    this.currentState.set(nextCoordinates);

    // If there is no active drawing session, update the completed feature on the map.
    if (!this.activeDrawState) {
      // Convert the draft coordinates into valid polygon coordinates.
      // This closes polygon rings when needed.
      const buildingCoordinates = this.getValidPolygonCoordinates(nextCoordinates);

      // Update the selected building coordinates and the form model.
      this.selectedBuildingCoordinates.set(buildingCoordinates);
      this.buildingPolygonModel.update(building => ({
        ...building,
        coordinates: buildingCoordinates
      }));

      // Replace the feature displayed by MapLibre Draw.
      this.replaceDrawFeature(nextCoordinates);
      return;
    }

    // If the user is currently drawing a polygon, update MapLibre Draw's polygon state directly.
    if (this.activeDrawState.kind === 'polygon') {
      const state = this.activeDrawState.state;

      // Apply the coordinates to the active polygon.
      state.polygon.setCoordinates(nextCoordinates);

      // Keep MapLibre Draw's vertex counter in sync with the restored state.
      state.currentVertexPosition = nextCoordinates[0]?.length ?? 0;
      return;
    }

    // Otherwise, the user is currently drawing a line.
    const state = this.activeDrawState.state;
    const lineCoordinates = nextCoordinates[0] ?? [];

    // Apply the restored coordinates to the active line.
    state.line.setCoordinates(lineCoordinates);

    // Keep MapLibre Draw's vertex counter in sync with the restored line state.
    state.currentVertexPosition = lineCoordinates.length;
  }

  private replaceDrawFeature(coordinates: Position[][]) {
    // Remove all existing drawn features from the map.
    this.draw.deleteAll();

    // Ensure the coordinates form a valid polygon before adding them back to the map.
    const closedCoordinates = this.getValidPolygonCoordinates(coordinates);

    // If the polygon does not have enough points, there is nothing valid to draw.
    if (closedCoordinates.length === 0) {
      return;
    }

    // Build a GeoJSON FeatureCollection so MapLibre Draw can display the polygon.
    const featureCollection: FeatureCollection<Polygon> = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: closedCoordinates
        }
      }]
    };

    // Set the new polygon feature on the Draw control.
    this.draw.set(featureCollection);
  }

  private getValidPolygonCoordinates(coordinates: Position[][]) {
    // A polygon needs at least 3 points in the outer ring.
    // If it has fewer than 3 points, return an empty result.
    if ((coordinates[0]?.length ?? 0) < 3) {
      return [];
    }

    // Ensure every ring is closed.
    // In GeoJSON, the first and last coordinate of a polygon ring must be the same.
    return coordinates.map(ring => {
      const first = ring[0];
      const last = ring.at(-1);

      // If the ring is already closed, return it unchanged.
      if (!first || !last || (first[0] === last[0] && first[1] === last[1])) {
        return ring;
      }

      // Otherwise, close the ring by appending the first coordinate to the end.
      return [...ring, first];
    });
  }

  onPublicChange(isItPublic: boolean) {
    //Update the model's isItPublic property
    this.buildingPolygonModel.update(building => ({
      ...building,
      isItPublic
    }));
  }

  onCreate() {

    //Get the form values
    const name = this.createBuildingForm.name().value();
    const category = this.createBuildingForm.category().value();
    const description = this.createBuildingForm.description().value();
    const userId = this.authService.getCurrentUserId();
    const isItPublic = this.createBuildingForm().value().isItPublic;

    //Send error message if there is no drawing present
    if (this.selectedBuildingCoordinates().length == 0) {
      this.messageService.SendErrorMessageSnackbar("You must draw a building first!", "X");
      return;
    }

    //Update the signal with the form's values
    this.buildingPolygonModel.update(building => ({
      ...building,
      name,
      category,
      description,
      userId,
      isItPublic
    }));


    const building = {
      ...this.buildingPolygonModel()
    };


    //Create the building
    this.buildingService.createBuilding(building)
      .subscribe({
        //After we successfully create the building, we send a message and navigate to the map page
        next: createdBuilding => {
          this.messageService.SendSuccessMessageSnackbar(
            'Successfully created building: ' + createdBuilding.name + '!', 'X');

          this.router.navigateByUrl('/api/map');
        },
        error: err => {
          console.error('Failed to create building:', err);
        }
      });
  }

  buildingPolygonModel = signal<BuildingPolygon>({
    name: '',
    category: '',
    description: '',
    coordinates: [[]],
    userId: 0,
    isItPublic: false
  });


  //calling the new form() function creates a signal form based on the model and the declared schemaPath configuration
  createBuildingForm = form(this.buildingPolygonModel, (schemaPath) => {
    //there are builtin validators like required, minLength, pattern etc.
    required(schemaPath.name);
    required(schemaPath.category);
    required(schemaPath.description);
    polygonCoordinatesValidator(schemaPath.coordinates);

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
    const errors = this.createBuildingForm.coordinates().errors();

    const polygonError = errors.find(
      error => error.kind === 'polygonCoords'
    );

    if (polygonError?.message !== undefined) {
      return polygonError.message;
    }

    return '';
  }
}
