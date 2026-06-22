import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EditBuilding} from './edit-building';

describe('EditBuilding', () => {
  let component: EditBuilding;
  let fixture: ComponentFixture<EditBuilding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBuilding]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditBuilding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
