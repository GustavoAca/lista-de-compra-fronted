import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemListDisplayComponent } from './item-list-display.component';

describe('ItemListDisplayComponent', () => {
  let component: ItemListDisplayComponent;
  let fixture: ComponentFixture<ItemListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
