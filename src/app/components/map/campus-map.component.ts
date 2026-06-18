import {Component, inject, OnInit} from '@angular/core';
import {IControl, Map as MapLibreMap, Popup, StyleSpecification} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import {Feature, FeatureCollection, GeoJsonProperties, Geometry, Polygon, Position} from 'geojson';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {centroid} from '@turf/turf';
import {take} from 'rxjs';
import {BuildingService} from '../../services/building.service';
import {BuildingPoint} from '../../model/building.point.model';
import {BuildingPolygon} from '../../model/building.polygon.model';

@Component({
  selector: 'app-map',
  imports: [
    NgxMapLibreGLModule
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

  ngOnInit() {
    this.style = {
      version: 8,
      sources: {},
      layers: [],
    };

    this.loadBuildings();
  }

  onMapLoad(map: MapLibreMap) {
    this.map = map;

    this.addDraw(map);
    this.addPopups(map);
  }

  private loadBuildings() {
    this.buildingService.getBuildings()
      .pipe(take(1))
      .subscribe({
        next: buildings => {
          this.pois = this.mapBuildingsToFeatureCollection(buildings);
          console.log(this.pois);
        },
        error: err => {
          console.error('Failed to load buildings for map:', err);
        }
      });
  }

  private mapBuildingsToFeatureCollection(
    buildings: (BuildingPoint | BuildingPolygon)[]
  ): FeatureCollection {
    return {
      type: 'FeatureCollection',
      // Convert every building model into a GeoJSON feature that MapLibre can render.
      // Invalid geometries are skipped so one bad database record does not break the map.
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
    console.log(e);
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
