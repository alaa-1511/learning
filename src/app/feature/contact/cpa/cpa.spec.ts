import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CPA } from './cpa';

describe('CPA', () => {
  let component: CPA;
  let fixture: ComponentFixture<CPA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CPA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CPA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
