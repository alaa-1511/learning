import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertIFR } from './cert-ifr';

describe('CertIFR', () => {
  let component: CertIFR;
  let fixture: ComponentFixture<CertIFR>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertIFR]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertIFR);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
