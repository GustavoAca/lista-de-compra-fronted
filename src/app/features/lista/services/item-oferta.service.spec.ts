import { TestBed } from '@angular/core/testing';

import { ItemOfertaService } from './item-oferta.service';

describe('ItemOfertaService', () => {
  let service: ItemOfertaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemOfertaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
