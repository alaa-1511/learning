import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SOCPA } from './socpa';

describe('SOCPA', () => {
  let component: SOCPA;
  let fixture: ComponentFixture<SOCPA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SOCPA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SOCPA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
