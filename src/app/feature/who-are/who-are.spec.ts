import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhoAre } from './who-are';

describe('WhoAre', () => {
  let component: WhoAre;
  let fixture: ComponentFixture<WhoAre>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhoAre]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhoAre);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
