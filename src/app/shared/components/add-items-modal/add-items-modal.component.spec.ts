import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddItemsModalComponent } from './add-items-modal.component';

describe('AddItemsModalComponent', () => {
  let component: AddItemsModalComponent;
  let fixture: ComponentFixture<AddItemsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddItemsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddItemsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
