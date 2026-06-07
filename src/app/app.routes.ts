import { Routes } from '@angular/router';
import {Login} from './components/login/login';
import {CampusMapComponent} from './components/map/campus-map.component';
import {BuildingList} from './components/building-list/building-list';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'map',
    component: CampusMapComponent,
  },
  {
    path: 'buildings',
    component: BuildingList,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
