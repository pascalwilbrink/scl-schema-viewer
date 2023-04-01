import { TestBed } from '@angular/core/testing';

import { XsdService } from './xsd.service';

describe('XsdService', () => {
  let service: XsdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XsdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
