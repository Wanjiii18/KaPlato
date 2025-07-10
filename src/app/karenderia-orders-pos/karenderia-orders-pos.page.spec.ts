import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaOrdersPosPage } from './karenderia-orders-pos.page';

describe('KarenderiaOrdersPosPage', () => {
  let component: KarenderiaOrdersPosPage;
  let fixture: ComponentFixture<KarenderiaOrdersPosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaOrdersPosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
