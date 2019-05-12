import { TestBed } from '@angular/core/testing';

import { SurveyDataService } from './survey-data.service';

describe('SurveyDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SurveyDataService = TestBed.get(SurveyDataService);
    expect(service).toBeTruthy();
  });
});
