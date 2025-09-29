import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaPosPage } from './karenderia-pos.page';

describe('KarenderiaPosPage', () => {
  let component: KarenderiaPosPage;
  let fixture: ComponentFixture<KarenderiaPosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaPosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
