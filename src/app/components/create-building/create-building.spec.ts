import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CreateBuilding} from './create-building';

describe('CreateBuilding', () => {
  let component: CreateBuilding;
  let fixture: ComponentFixture<CreateBuilding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBuilding]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateBuilding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
