import {Component, inject, Input, OnInit} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {Observable, tap} from 'rxjs';
import {LoadingService} from '../../services/loading.service';
import {RouteConfigLoadEnd, RouteConfigLoadStart, Router} from '@angular/router';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-indicator',
  imports: [
    AsyncPipe,
    MatProgressSpinner
  ],
  templateUrl: './loading-indicator.html',
  styleUrl: './loading-indicator.css',
})
export class LoadingIndicator implements OnInit {

  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);

  loading$: Observable<boolean>;

  @Input()
    //We can check the route transitions by setting this to truu
  detectRouteTransitions = false;

  constructor() {
    //Set this service's loading$ observable to the service's loading$ observable
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit() {
    //Check if we should detect route transitions
    if (this.detectRouteTransitions) {
      this.router.events
        .pipe(
          tap((event) => {
            //Lazily load the spinner component
            if (event instanceof RouteConfigLoadStart) {
              this.loadingService.loadingOn();
            } else if (event instanceof RouteConfigLoadEnd) {
              this.loadingService.loadingOff();
            }
          })
        )
        .subscribe();
    }
  }
}

