import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CAT } from './cat';

describe('CAT', () => {
  let component: CAT;
  let fixture: ComponentFixture<CAT>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CAT]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CAT);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
