import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaApplicationPage } from './karenderia-application.page';

describe('KarenderiaApplicationPage', () => {
  let component: KarenderiaApplicationPage;
  let fixture: ComponentFixture<KarenderiaApplicationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaApplicationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
