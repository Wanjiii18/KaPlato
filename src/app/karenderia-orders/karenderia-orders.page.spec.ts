import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaOrdersPage } from './karenderia-orders.page';

describe('KarenderiaOrdersPage', () => {
  let component: KarenderiaOrdersPage;
  let fixture: ComponentFixture<KarenderiaOrdersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
