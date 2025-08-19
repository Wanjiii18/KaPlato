import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../services/analytics.service';
import { OrderService } from '../services/order.service';
import { ToastController } from '@ionic/angular';
import { SalesAnalytics } from '../models/menu.model';

@Component({
  selector: 'app-karenderia-analytics',
  templateUrl: './karenderia-analytics.page.html',
  styleUrls: ['./karenderia-analytics.page.scss'],
  standalone: false
})
export class KarenderiaAnalyticsPage implements OnInit {
  dailyAnalytics: SalesAnalytics | null = null;
  weeklyAnalytics: SalesAnalytics | null = null;
  monthlyAnalytics: SalesAnalytics | null = null;
  
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  currentSeason: string = '';
  seasonalTrends: any[] = [];
  seasonalRecommendations: string[] = [];
  
  // Chart data
  salesByTimeData: any[] = [];
  topItemsData: any[] = [];
  
  constructor(
    private analyticsService: AnalyticsService,
    private orderService: OrderService,
    private toastController: ToastController
  ) { }

  // Add missing method
  getRecommendationIcon(index: number): string {
    const icons = ['bulb', 'trending-up', 'flash', 'star', 'rocket'];
    return icons[index % icons.length];
  }

  async ngOnInit() {
    this.currentSeason = this.getCurrentSeason();
    this.seasonalRecommendations = this.analyticsService.getSeasonalRecommendations(this.currentSeason);
    
    await this.loadAllAnalytics();
    await this.loadSeasonalTrends();
  }

  /**
   * Open the order modal for placing orders
   */
  async openOrderModal() {
    try {
      const result = await this.orderService.openOrderModal();
      
      if (result && result.success) {
        const toast = await this.toastController.create({
          message: `Order placed successfully! Updating analytics...`,
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        
        // Refresh analytics after order is placed
        await this.loadAllAnalytics();
        await this.loadSeasonalTrends();
      }
    } catch (error) {
      console.error('Error opening order modal:', error);
      const toast = await this.toastController.create({
        message: 'Failed to open order modal',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async loadAllAnalytics() {
    const karenderiaId = 'karenderia-id'; // Replace with actual ID
    
    try {
      this.dailyAnalytics = await this.analyticsService.getSalesAnalytics(karenderiaId, 'daily');
      this.weeklyAnalytics = await this.analyticsService.getSalesAnalytics(karenderiaId, 'weekly');
      this.monthlyAnalytics = await this.analyticsService.getSalesAnalytics(karenderiaId, 'monthly');
      
      this.updateChartData();
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async loadSeasonalTrends() {
    const karenderiaId = 'karenderia-id'; // Replace with actual ID
    
    try {
      this.seasonalTrends = await this.analyticsService.getPopularItemsBySeason(karenderiaId, this.currentSeason);
    } catch (error) {
      console.error('Error loading seasonal trends:', error);
    }
  }

  updateChartData() {
    const analytics = this.getSelectedAnalytics();
    
    if (analytics) {
      this.salesByTimeData = analytics.salesByTimeOfDay;
      this.topItemsData = analytics.topSellingItems.slice(0, 5);
    }
  }

  onPeriodChange() {
    this.updateChartData();
  }

  getSelectedAnalytics(): SalesAnalytics | null {
    switch (this.selectedPeriod) {
      case 'daily': return this.dailyAnalytics;
      case 'weekly': return this.weeklyAnalytics;
      case 'monthly': return this.monthlyAnalytics;
      default: return this.dailyAnalytics;
    }
  }

  getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return month === 12 ? 'christmas' : 'dry';
    if (month >= 3 && month <= 5) return 'summer';
    return 'wet';
  }

  formatPhp(amount: number): string {
    return this.analyticsService.formatPhp(amount);
  }

  getProfitMarginPercentage(): number {
    const analytics = this.getSelectedAnalytics();
    if (!analytics || analytics.totalSales === 0) return 0;
    return (analytics.totalProfit / analytics.totalSales) * 100;
  }

  getSeasonIcon(season: string): string {
    const icons: { [key: string]: string } = {
      'summer': 'sunny',
      'wet': 'rainy',
      'dry': 'partly-sunny',
      'christmas': 'gift'
    };
    return icons[season] || 'calendar';
  }

  getTimeSlotIcon(timeSlot: string): string {
    const icons: { [key: string]: string } = {
      'breakfast': 'cafe',
      'lunch': 'restaurant',
      'merienda': 'ice-cream',
      'dinner': 'wine',
      'late-night': 'moon'
    };
    return icons[timeSlot] || 'time';
  }

  getTrendingIcon(item: any): string {
    if (item.trending === 'up') return 'trending-up';
    if (item.trending === 'down') return 'trending-down';
    return 'remove';
  }

  getTrendingColor(item: any): string {
    if (item.trending === 'up') return 'success';
    if (item.trending === 'down') return 'danger';
    return 'medium';
  }

  getMaxRevenue(): number {
    return Math.max(...this.salesByTimeData.map(slot => slot.revenue));
  }
}
