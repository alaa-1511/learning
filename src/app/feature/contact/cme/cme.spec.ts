import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CME } from './cme';

describe('CME', () => {
  let component: CME;
  let fixture: ComponentFixture<CME>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CME]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CME);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
