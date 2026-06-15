import {Routes} from '@angular/router';
import {Login} from './components/login/login';
import {CampusMapComponent} from './components/map/campus-map.component';
import {BuildingList} from './components/building-list/building-list';
import {AuthGuard} from './guards/auth-guard';
import {GuestGuard} from './guards/guest-guard';

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
    path: '**',
    redirectTo: 'api/login'
  }
];
