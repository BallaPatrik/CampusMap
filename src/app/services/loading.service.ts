import {BehaviorSubject} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: "root",
})
export class LoadingService {

  //Store the current state of the loading indicator.
  private loadingSubject =
    new BehaviorSubject<boolean>(false);

  // Expose the subject as observable so that any component can subscribe to it
  // and get notified when the loading indicator is turned on or off.
  loading$ = this.loadingSubject.asObservable();

  //Turn on the loading indicator
  loadingOn() {
    this.loadingSubject.next(true);
  }

  //Turn off the loading indicator
  loadingOff() {
    this.loadingSubject.next(false);
  }
}
