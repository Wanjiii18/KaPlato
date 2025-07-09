import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaIngredientsPage } from './karenderia-ingredients.page';

describe('KarenderiaIngredientsPage', () => {
  let component: KarenderiaIngredientsPage;
  let fixture: ComponentFixture<KarenderiaIngredientsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaIngredientsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
