import { TestBed } from '@angular/core/testing';

import { UuidService } from './uuid.service';

describe('UuidService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UuidService = TestBed.get(UuidService);
    expect(service).toBeTruthy();
  });
});
