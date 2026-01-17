import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeTrail } from './free-trail';

describe('FreeTrail', () => {
  let component: FreeTrail;
  let fixture: ComponentFixture<FreeTrail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeTrail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeTrail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
