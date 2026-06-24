import {Directive, HostListener, output} from '@angular/core';

@Directive({
  selector: '[appEditBuilding]',
})
export class EditBuilding {

  editAction = output();

  //here we select a card by double clicking on it
  @HostListener('dblclick')
  onDoubleClick() {
    this.editAction.emit();
  }

}
