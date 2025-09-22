import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyMenuManagementPage } from './daily-menu-management.page';

describe('DailyMenuManagementPage', () => {
  let component: DailyMenuManagementPage;
  let fixture: ComponentFixture<DailyMenuManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyMenuManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
