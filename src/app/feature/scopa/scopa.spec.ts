import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scopa } from './scopa';

describe('Scopa', () => {
  let component: Scopa;
  let fixture: ComponentFixture<Scopa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scopa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Scopa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
