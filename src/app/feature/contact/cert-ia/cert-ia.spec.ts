import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertIA } from './cert-ia';

describe('CertIA', () => {
  let component: CertIA;
  let fixture: ComponentFixture<CertIA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertIA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertIA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
