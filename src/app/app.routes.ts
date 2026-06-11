import { Routes } from '@angular/router';
import {Login} from './components/login/login';
import {CampusMapComponent} from './components/map/campus-map.component';
import {BuildingList} from './components/building-list/building-list';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'api/login',
    pathMatch: 'full',
  },
  {
    path: 'api/login',
    component: Login,
  },
  {
    path: 'api/map',
    component: CampusMapComponent,
  },
  {
    path: 'api/buildings',
    component: BuildingList,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
