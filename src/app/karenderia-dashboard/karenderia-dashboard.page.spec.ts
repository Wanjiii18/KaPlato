import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaDashboardPage } from './karenderia-dashboard.page';

describe('KarenderiaDashboardPage', () => {
  let component: KarenderiaDashboardPage;
  let fixture: ComponentFixture<KarenderiaDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
