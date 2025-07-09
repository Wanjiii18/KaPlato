import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaAnalyticsPage } from './karenderia-analytics.page';

describe('KarenderiaAnalyticsPage', () => {
  let component: KarenderiaAnalyticsPage;
  let fixture: ComponentFixture<KarenderiaAnalyticsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KarenderiaAnalyticsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
