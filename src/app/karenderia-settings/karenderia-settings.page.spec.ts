import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KarenderiaSettingsPage } from './karenderia-settings.page';

describe('KarenderiaSettingsPage', () => {
  let component: KarenderiaSettingsPage;
  let fixture: ComponentFixture<KarenderiaSettingsPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KarenderiaSettingsPage]
    });
    fixture = TestBed.createComponent(KarenderiaSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
  