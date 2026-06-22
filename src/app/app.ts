import {Component, inject, OnInit} from '@angular/core';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {LocalStorageKeys} from './constants/local-storage-keys';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {IconService} from './services/icon.service';
import {AuthService} from './services/auth.service';
import {LoadingIndicator} from './components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-root',
  imports: [NgxMapLibreGLModule, MatIcon, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, RouterLink, MatButton, RouterOutlet, LoadingIndicator],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  private readonly icon_service=inject(IconService);
  private readonly router = inject(Router);
  private readonly authService=inject(AuthService);

  ngOnInit(): void {
    //Add the icons to the list
    this.icon_service.registerIcons();
  }

  get isLoggedIn() {
    return localStorage.getItem(LocalStorageKeys.TOKEN) !== null;
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('api/login');
    });
  }
}
