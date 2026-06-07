import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampusMapComponent } from './campus-map.component';

describe('Map', () => {
  let component: CampusMapComponent;
  let fixture: ComponentFixture<CampusMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampusMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampusMapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
