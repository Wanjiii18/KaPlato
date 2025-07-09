import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaMenuPage } from './karenderia-menu.page';

describe('KarenderiaMenuPage', () => {
  let component: KarenderiaMenuPage;
  let fixture: ComponentFixture<KarenderiaMenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
