import { TestBed } from '@angular/core/testing';

import { StudyTasksService } from './study-tasks.service';

describe('StudyTasksService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StudyTasksService = TestBed.get(StudyTasksService);
    expect(service).toBeTruthy();
  });
});
