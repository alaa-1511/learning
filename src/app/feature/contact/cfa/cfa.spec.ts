import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CFA } from './cfa';

describe('CFA', () => {
  let component: CFA;
  let fixture: ComponentFixture<CFA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CFA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CFA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
