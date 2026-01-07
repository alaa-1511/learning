import { TestBed } from '@angular/core/testing';

import { Flowbit } from './flowbit';

describe('Flowbit', () => {
  let service: Flowbit;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Flowbit);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
