import {Component, inject, OnInit} from '@angular/core';
import {IControl, Map as MapLibreMap, Popup, StyleSpecification} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import {Feature, FeatureCollection, GeoJsonProperties, Geometry, Polygon} from 'geojson';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {centroid} from '@turf/turf';
import {RequestService} from '../../services/request.service';
import {take} from 'rxjs';

@Component({
  selector: 'app-map',
  imports: [
    NgxMapLibreGLModule
  ],
  templateUrl: './campus-map.component.html',
  styleUrl: './campus-map.component.css',
})
export class CampusMapComponent implements OnInit{
  private readonly requestService=inject(RequestService);

  protected style!: StyleSpecification;
  protected pois: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  protected draw!: MapLibreDraw;

  ngOnInit() {
    this.style = {
      version: 8,
      sources: {},
      layers: [],
    };

    this.requestService
      //Send a get request to the json server to get the features
      .get<Feature<Geometry, GeoJsonProperties>[]>('http://localhost:3000/buildings')
      //Take the 1st response
      .pipe(take(1))
      //We subscribe
      .subscribe((features) => {
        //Set the text color to blue
        features.forEach((feature) => {
          if (feature.properties == null) {
            feature.properties = {};
          }
          feature.properties['color'] = 'blue';
        });

        this.pois = {
          type: 'FeatureCollection',
          features
        };
      });
  }

  onMapLoad(map: MapLibreMap) {
    this.addDraw(map);
    this.addPopups(map);
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
