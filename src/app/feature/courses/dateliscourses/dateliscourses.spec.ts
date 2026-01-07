import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dateliscourses } from './dateliscourses';

describe('Dateliscourses', () => {
  let component: Dateliscourses;
  let fixture: ComponentFixture<Dateliscourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dateliscourses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dateliscourses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
