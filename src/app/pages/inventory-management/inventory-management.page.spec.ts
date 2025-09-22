import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryManagementPage } from './inventory-management.page';

describe('InventoryManagementPage', () => {
  let component: InventoryManagementPage;
  let fixture: ComponentFixture<InventoryManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
