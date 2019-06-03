import { TestBed } from '@angular/core/testing';

import { SurveyCacheService } from './survey-cache.service';

describe('FileDownloaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SurveyCacheService = TestBed.get(SurveyCacheService);
    expect(service).toBeTruthy();
  });
});
