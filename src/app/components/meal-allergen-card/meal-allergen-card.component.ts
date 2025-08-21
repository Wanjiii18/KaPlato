import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AllergenDetectionService, MealSafetyAnalysis, AllergenWarning } from '../../services/allergen-detection.service';

@Component({
  selector: 'app-meal-allergen-card',
  templateUrl: './meal-allergen-card.component.html',
  styleUrls: ['./meal-allergen-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MealAllergenCardComponent implements OnInit {
  @Input() meal: any; // Meal data with ingredients
  @Input() showDetails: boolean = true;
  
  safetyAnalysis: MealSafetyAnalysis | null = null;
  showIngredients: boolean = false;

  constructor(private allergenService: AllergenDetectionService) {}

  ngOnInit() {
    if (this.meal && this.meal.ingredients) {
      this.analyzeMealSafety();
    }
  }

  private analyzeMealSafety() {
    this.safetyAnalysis = this.allergenService.analyzeMealSafety(
      this.meal.ingredients, 
      this.meal.name
    );
  }

  getRiskLevelColor(): string {
    if (!this.safetyAnalysis) return 'medium';
    
    switch (this.safetyAnalysis.riskLevel) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getRiskLevelIcon(): string {
    if (!this.safetyAnalysis) return 'help-outline';
    
    switch (this.safetyAnalysis.riskLevel) {
      case 'high': return 'warning';
      case 'medium': return 'alert-circle-outline';
      case 'low': return 'checkmark-circle-outline';
      default: return 'help-outline';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'severe': return 'warning';
      case 'moderate': return 'alert-circle-outline';
      case 'mild': return 'information-circle-outline';
      default: return 'help-outline';
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'severe': return 'danger';
      case 'moderate': return 'warning';
      case 'mild': return 'primary';
      default: return 'medium';
    }
  }

  toggleIngredients() {
    this.showIngredients = !this.showIngredients;
  }

  getAllergenBadgeColor(allergen: string): string {
    const commonAllergens = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Fish', 'Shellfish'];
    return commonAllergens.includes(allergen) ? 'danger' : 'warning';
  }

  getIngredientColor(ingredient: string): string {
    if (!this.safetyAnalysis) return 'medium';
    
    // Check if this ingredient contains any allergens
    for (const warning of this.safetyAnalysis.warnings) {
      if (warning.foundIn.includes(ingredient)) {
        return this.getSeverityColor(warning.severity);
      }
    }
    return 'medium';
  }
}
