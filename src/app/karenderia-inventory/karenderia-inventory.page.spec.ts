import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaInventoryPage } from './karenderia-inventory.page';

describe('KarenderiaInventoryPage', () => {
  let component: KarenderiaInventoryPage;
  let fixture: ComponentFixture<KarenderiaInventoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaInventoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
