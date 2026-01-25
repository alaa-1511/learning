import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DIPIFRS } from './dipifrs';

describe('DIPIFRS', () => {
  let component: DIPIFRS;
  let fixture: ComponentFixture<DIPIFRS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DIPIFRS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DIPIFRS);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
