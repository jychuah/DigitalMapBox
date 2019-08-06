import { TestBed } from '@angular/core/testing';

import { MapSocketService } from './map-socket.service';

describe('MapSocketService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapSocketService = TestBed.get(MapSocketService);
    expect(service).toBeTruthy();
  });
});
