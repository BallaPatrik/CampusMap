import {Component, inject, OnInit, signal} from '@angular/core';
import {IControl, Map as MapLibreMap, Popup, StyleSpecification} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import {Feature, FeatureCollection, GeoJsonProperties, Geometry, Polygon, Position} from 'geojson';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {bbox, centroid} from '@turf/turf';
import {take} from 'rxjs';
import {BuildingService} from '../../services/building.service';
import {BuildingPoint} from '../../model/building.point.model';
import {BuildingPolygon} from '../../model/building.polygon.model';
import {BuildingList} from '../building-list/building-list';

@Component({
  selector: 'app-map',
  imports: [
    NgxMapLibreGLModule,
    BuildingList
  ],
  templateUrl: './campus-map.component.html',
  styleUrl: './campus-map.component.css',
})
export class CampusMapComponent implements OnInit{
  private readonly buildingService = inject(BuildingService);

  protected style!: StyleSpecification;
  protected pois: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  protected draw!: MapLibreDraw;

  private map?: MapLibreMap;

  //This is needed for making the buildings different style if they are selected
  protected selectedBuildingIds = signal<string[]>([]);

  ngOnInit() {
    this.style = {
      version: 8,
      sources: {},
      layers: [],
    };

    this.loadBuildings("own");
  }

  onMapLoad(map: MapLibreMap) {
    this.map = map;

    this.addDraw(map);
    this.addPopups(map);
    this.addBuildingClickSelection(map);
  }

  protected onSelectedBuildingIdsChange(buildingIds: string[]) {

    //Get the newly selected building's id from the selection
    const newlySelectedBuildingId = buildingIds.find(
      //Get the id from the new list that WAS NOT IN the previous list
      buildingId => !this.selectedBuildingIds().includes(buildingId)
    );

    //When the change happens, we set the selectedBuildingIds signal
    this.selectedBuildingIds.set(buildingIds);

    //If a new building was selected from the list, zoom to it
    if (newlySelectedBuildingId) {
      this.zoomToBuilding(newlySelectedBuildingId);
    }
  }

  private zoomToBuilding(buildingId: string) {

    //If there is no map, then return
    if (!this.map) {
      return;
    }

    //Get the feature's id
    const feature = this.pois.features.find(
      feature => feature.properties?.['id'] === buildingId
    );

    //If it doesn't exist, then return
    if (!feature) {
      return;
    }

    if (feature.geometry.type === 'Point') {
      this.map.flyTo({
        center: [
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1]
        ],
        zoom: 18,
        essential: true
      });
      return;
    }

    if (feature.geometry.type === 'Polygon') {
      const [minLng, minLat, maxLng, maxLat] = bbox(feature);

      this.map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {
          padding: 80,
          maxZoom: 18,
          duration: 1000
        }
      );
    }
  }

  loadBuildings(filter: string) {
    if (filter == "own") {
      this.buildingService.getOwnBuildings()
        .pipe(take(1))
        .subscribe({
          next: buildings => {
            this.pois = this.mapBuildingsToFeatureCollection(buildings);
          },
          error: err => {
            console.error('Failed to load buildings for map:', err);
          }
        });
    } else {
      this.buildingService.getOwnAndPublicBuildings()
        .pipe(take(1))
        .subscribe({
          next: buildings => {
            this.pois = this.mapBuildingsToFeatureCollection(buildings);
          },
          error: err => {
            console.error('Failed to load buildings for map:', err);
          }
        });
    }
  }

  private mapBuildingsToFeatureCollection(
    buildings: (BuildingPoint | BuildingPolygon)[]
  ): FeatureCollection {
    return {
      type: 'FeatureCollection',
      // Convert every building model into a GeoJSON feature that MapLibre can render.
      // Invalid geometries are skipped, so one bad database record does not break the map.
      features: buildings
        //Map the features to a format that MapLibre can understand
        .map(building => this.mapBuildingToFeature(building))
        //Filter out every feature where the feature is NOT null
        .filter((feature): feature is Feature<Geometry, GeoJsonProperties> => feature !== null)
    };
  }

  private mapBuildingToFeature(
    building: BuildingPoint | BuildingPolygon
  ): Feature<Geometry, GeoJsonProperties> | null {

    //Get the feature's geometry (Point or Polygon) and also it's coordinates
    const geometry = this.mapBuildingGeometry(building.coordinates);

    if (!geometry) {
      console.warn(`Skipping building with invalid geometry: ${building.name}`);
      return null;
    }

    //Return the feature with the geometry and the building's properties
    return {
      type: 'Feature',
      id: building.id,
      properties: {
        id: building.id,
        name: building.name,
        category: building.category,
        description: building.description,
        color: 'blue'
      },
      geometry
    };
  }

  private mapBuildingGeometry(coords: Position | Position[][]): Geometry | null {
    // A Point is stored as one coordinate pair: [lng, lat].
    if (this.isPosition(coords)) {
      return {
        type: 'Point',
        coordinates: coords
      };
    }

    // A Polygon needs a list of rings. The normalizer also accepts older flat data
    // shaped like [[lng, lat], ...] and wraps it into the official GeoJSON format.
    const polygonCoordinates = this.normalizePolygonCoordinates(coords);

    if (!polygonCoordinates) return null;

    return {
      type: 'Polygon',
      coordinates: polygonCoordinates
    };
  }

  private normalizePolygonCoordinates(coords: Position[][]): Position[][] | null {
    //If it's not an array or the length is empty, then we return null
    if (!Array.isArray(coords) || coords.length === 0) return null;

    // Some saved polygons are one linear ring instead of an array of rings.
    // MapLibre expects Polygon coordinates as [[[lng, lat], ...]].
    //This is a ring, not a polygon, so we need to handle it differently.
    if (this.isLinearRing(coords)) {
      return [this.closeLinearRing(coords)];
    }

    // If the data is already ring-based, keep only valid rings.
    const rings = coords
      //Keep the valid rings.
      .filter((ring): ring is Position[] => this.isLinearRing(ring))
      //And close them if they need to be closed.
      .map(ring => this.closeLinearRing(ring));

    //If there is at least 1 ring, then we return it/them, otherwise return null
    return rings.length > 0 ? rings : null;
  }

  private isPosition(coords: unknown): coords is Position {
    // GeoJSON coordinates are longitude/latitude number pairs.
    return Array.isArray(coords)
      && typeof coords[0] === 'number'
      && typeof coords[1] === 'number';
  }

  private isLinearRing(coords: unknown): coords is Position[] {
    // A polygon ring must contain at least four positions, including the closing point.
    return Array.isArray(coords)
      && coords.length >= 4
      && coords.every(coord => this.isPosition(coord));
  }

  private closeLinearRing(ring: Position[]): Position[] {
    // GeoJSON requires the first and last coordinate of a polygon ring to be the same.

    const first = ring[0];
    const last = ring[ring.length - 1];

    //If the first and last coords are the same, then we can return the ring unchanged
    if (first[0] === last[0] && first[1] === last[1]) return ring;

    //Otherwise make it a ring by inserting the first coord at the end
    return [...ring, first];
  }

  addDraw(map: MapLibreMap) {
    this.draw = new MapLibreDraw({
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.addControl(this.draw as unknown as IControl);

    map.on('draw.create', (e) => this.onDrawEvent(e));
  }

  onDrawEvent(e: { features: Feature<Polygon>[]; type: string }) {
    //console.log(e);
  }

  private addBuildingClickSelection(map: MapLibreMap) {
    //This function handles building selection when we click on the map

    //Create a click event on the point and polygon layer
    map.on('click', ['pois-point-layer', 'pois-polygon-fill-layer'], (e) => {

      //If there are no features, then return
      if (!e.features || e.features.length === 0) {
        return;
      }

      //Get the first feature's id
      const feature = e.features[0] as Feature<Geometry, GeoJsonProperties>;
      const buildingId = feature.properties?.['id'];

      //If it's not a string then return
      if (typeof buildingId !== 'string') {
        return;
      }

      //Else we want to toggle the building
      this.toggleSelectedBuilding(buildingId);
    });
  }

  private toggleSelectedBuilding(buildingId: string) {
    //If the building is already selected, then we remove it from the list
    if (this.selectedBuildingIds().includes(buildingId)) {
      this.selectedBuildingIds.set(
        this.selectedBuildingIds().filter(id => id !== buildingId)
      );
      return;
    }

    //Else we add it to the list
    this.selectedBuildingIds.set([
      ...this.selectedBuildingIds(),
      buildingId
    ]);
  }

  addPopups(map: MapLibreMap) {
    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'popup',
    });

    // Popups are attached only to the visible clickable layers:
    // point circles and polygon fills.
    map.on('mouseenter', ['pois-point-layer', 'pois-polygon-fill-layer'], (e) => {
      map.getCanvas().style.cursor = 'pointer';

      if (!e.features || !e) return;
      const feature = e.features[0] as Feature<Geometry>;

      if (!feature.properties) return;
      // Turf centroid gives a stable popup position for both points and polygons.
      const center = centroid(feature).geometry.coordinates as [number, number];
      const title = feature.properties['name'];
      const category=feature.properties['category'];
      const content = feature.properties['description'];

      popup
        .setLngLat(center)
        .setHTML(
          `<div class="bg-base-200 text-primary-content p-5"><strong class="text-xl">${title}</strong><br>Category: ${category}<br>${content}</div>`
        )
        .addTo(map);
    });

    map.on('mouseleave', ['pois-point-layer', 'pois-polygon-fill-layer'], (e) => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }
}
