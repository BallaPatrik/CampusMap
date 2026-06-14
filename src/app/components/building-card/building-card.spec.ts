import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BuildingCard} from './building-card';

describe('BuildingCard', () => {
  let component: BuildingCard;
  let fixture: ComponentFixture<BuildingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingCard]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BuildingCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
