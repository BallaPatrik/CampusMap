import {Component, OnInit} from '@angular/core';
import {StyleSpecification, Map as MapLibreMap, IControl, Popup} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import { FeatureCollection, Polygon, Feature } from 'geojson';
import pois from '../../pois.json';
//import pois from '../../pois.json';
//EZ JÖN













import {
  NgxMapLibreGLModule
} from '@maplibre/ngx-maplibre-gl';
import { centroid } from '@turf/turf';

@Component({
  selector: 'app-map',
  imports: [
    NgxMapLibreGLModule
  ],
  templateUrl: './campus-map.component.html',
  styleUrl: './campus-map.component.css',
})
export class CampusMapComponent implements OnInit{
  ngOnInit() {
    this.style = {
      version: 8,
      sources: {},
      layers: [],
    };

    this.pois = pois as FeatureCollection;
    this.pois.features.forEach((f) => {
      f.properties!['color'] = 'blue';
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

  protected style!: StyleSpecification;
  protected pois!: FeatureCollection;
  protected draw!: MapLibreDraw;
}
