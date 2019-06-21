import { TestBed, inject } from '@angular/core/testing';

import { PlannerService } from './task.service';

describe('PlannerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlannerService]
    });
  });

  it('should be created', inject([PlannerService], (service: PlannerService) => {
    expect(service).toBeTruthy();
  }));
});
