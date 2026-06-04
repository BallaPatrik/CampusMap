import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);

  registerIcons(): void {
    this.iconRegistry.addSvgIcon(
      'map',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/map.svg')
    );
  }
}
