import { TestBed } from '@angular/core/testing';

import { SpecailEmail } from './specailemail';

describe('SpecailEmail', () => {
  let service: SpecailEmail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpecailEmail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
