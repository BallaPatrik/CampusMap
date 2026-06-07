import {Component, inject, OnInit} from '@angular/core';
import {StyleSpecification, Map as MapLibreMap, IControl, Popup} from 'maplibre-gl';
import MapLibreDraw from 'maplibre-gl-draw';
import { FeatureCollection, Polygon, Feature } from 'geojson';
import { NgxMapLibreGLModule } from '@maplibre/ngx-maplibre-gl';
import { centroid } from '@turf/turf';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {LocalStorageKeys} from './constants/local-storage-keys';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {IconService} from './services/icon.service';

@Component({
  selector: 'app-root',
  imports: [NgxMapLibreGLModule, MatIcon, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, RouterLink, MatButton, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  private readonly icon_service=inject(IconService);
  readonly router = inject(Router);

  ngOnInit(): void {
    //Add the icons to the list
    this.icon_service.registerIcons();
  }

  get isLoggedIn() {
    return localStorage.getItem(LocalStorageKeys.TOKEN) !== null;
  }

  onLogout() {
    localStorage.removeItem(LocalStorageKeys.TOKEN);
    this.router.navigateByUrl('login');
  }
}
