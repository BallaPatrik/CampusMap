import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingList } from './building-list';

describe('BuildingList', () => {
  let component: BuildingList;
  let fixture: ComponentFixture<BuildingList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildingList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
