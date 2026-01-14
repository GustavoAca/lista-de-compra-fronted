import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCardGridComponent } from './lista-card-grid.component';

describe('ListaCardGridComponent', () => {
  let component: ListaCardGridComponent;
  let fixture: ComponentFixture<ListaCardGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCardGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaCardGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
