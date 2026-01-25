import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CMA } from './cma';

describe('CMA', () => {
  let component: CMA;
  let fixture: ComponentFixture<CMA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CMA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
