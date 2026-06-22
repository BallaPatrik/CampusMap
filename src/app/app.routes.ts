import {Routes} from '@angular/router';
import {Login} from './components/login/login';
import {CampusMapComponent} from './components/map/campus-map.component';
import {BuildingList} from './components/building-list/building-list';
import {AuthGuard} from './guards/auth-guard';
import {GuestGuard} from './guards/guest-guard';
import {CreateBuilding} from './components/create-building/create-building';
import {EditBuilding} from './components/edit-building/edit-building';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'api/login',
    pathMatch: 'full'
  },
  {
    path: 'api/login',
    component: Login,
    canActivate: [GuestGuard]
  },
  {
    path: 'api/map',
    component: CampusMapComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'api/buildings',
    component: BuildingList,
    canActivate: [AuthGuard]
  },
  {
    path: 'api/building/create',
    component: CreateBuilding,
    canActivate: [AuthGuard]
  },
  {
    path: 'api/building/edit/:id',
    component: EditBuilding,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'api/login'
  }
];
