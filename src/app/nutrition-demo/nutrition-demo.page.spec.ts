import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NutritionDemoPage } from './nutrition-demo.page';
import { EnhancedNutritionService } from '../services/enhanced-nutrition.service';
import { NutritionManagerComponent } from '../components/nutrition-manager.component';

describe('NutritionDemoPage', () => {
  let component: NutritionDemoPage;
  let fixture: ComponentFixture<NutritionDemoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(), 
        HttpClientTestingModule,
        NutritionDemoPage, // Import the standalone component
        NutritionManagerComponent // Import the standalone component
      ],
      providers: [EnhancedNutritionService]
    }).compileComponents();

    fixture = TestBed.createComponent(NutritionDemoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have demo options', () => {
    expect(component.demoOptions).toBeDefined();
    expect(component.demoOptions.length).toBe(3);
  });

  it('should load Filipino dishes', () => {
    expect(component.filipinoDishes).toBeDefined();
    expect(component.filipinoDishes.length).toBeGreaterThan(0);
  });
});
