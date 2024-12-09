import { TestBed } from '@angular/core/testing';

import { DescriptorService } from './descriptor.service';

describe('DescriptorService', () => {
  let service: DescriptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DescriptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
