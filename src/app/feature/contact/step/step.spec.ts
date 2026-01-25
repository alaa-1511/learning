import { ComponentFixture, TestBed } from '@angular/core/testing';

import { STEP } from './step';

describe('STEP', () => {
  let component: STEP;
  let fixture: ComponentFixture<STEP>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [STEP]
    })
    .compileComponents();

    fixture = TestBed.createComponent(STEP);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
