import {Component, inject, OnInit} from '@angular/core';
import {StyleSpecification, Map as MapLibreMap, IControl, Popup} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import { FeatureCollection, Polygon, Feature } from 'geojson';
import pois from './pois.json';
import { NgxMapLibreGLModule } from '@maplibre/ngx-maplibre-gl';
import { centroid } from '@turf/turf';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {LocalStorageKeys} from './constants/local-storage-keys';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
@Component({
  selector: 'app-root',
  imports: [NgxMapLibreGLModule, MatIcon, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, RouterLink, MatButton, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  ngOnInit(): void {
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

  //Innentől kezdve a jó kód van, ha kivettem már a egy külön komponensbe a map-et

  readonly router = inject(Router);

  get isLoggedIn() {
    return localStorage.getItem(LocalStorageKeys.TOKEN) !== null;
  }

  onLogout() {
    localStorage.removeItem(LocalStorageKeys.TOKEN);
    this.router.navigateByUrl('login');
  }
}
