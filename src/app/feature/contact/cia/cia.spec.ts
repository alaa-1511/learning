import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CIA } from './cia';

describe('CIA', () => {
  let component: CIA;
  let fixture: ComponentFixture<CIA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CIA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CIA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
