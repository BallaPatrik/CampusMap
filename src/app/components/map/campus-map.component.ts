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

  isPolygon(coords: Position | Position[][]): coords is Position[][] {
    return Array.isArray(coords) && Array.isArray(coords[0]);
  }

  private loadBuildings() {
    this.buildingService.getBuildings()
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

  private mapBuildingsToFeatureCollection(
    buildings: (BuildingPoint | BuildingPolygon)[]
  ): FeatureCollection<Geometry, GeoJsonProperties> {
    return {
      type: 'FeatureCollection',
      features: buildings.map(building => {
        const geometry = this.isPolygon(building.coordinates)
          ? {
            type: 'Polygon' as const,
            coordinates: building.coordinates
          }
          : {
            type: 'Point' as const,
            coordinates: building.coordinates
          };

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
      })
    };
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

    map.on('mouseenter', ['pois-layer'], (e) => {
      map.getCanvas().style.cursor = 'pointer';

      if (!e.features || !e) return;
      const feature = e.features[0] as Feature<Polygon>;

      if (!feature.properties) return;
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

    map.on('mouseleave', ['pois-layer'], (e) => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }
}
