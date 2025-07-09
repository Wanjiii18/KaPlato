import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { MenuService } from '../services/menu.service';

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastRestocked: Date;
  expiryDate?: Date;
  category: 'vegetables' | 'meat' | 'spices' | 'beverages' | 'others';
}

@Component({
  selector: 'app-karenderia-inventory',
  templateUrl: './karenderia-inventory.page.html',
  styleUrls: ['./karenderia-inventory.page.scss'],
  standalone: false
})
export class KarenderiaInventoryPage implements OnInit {
  
  inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Rice',
      currentStock: 50,
      minimumStock: 10,
      unit: 'kg',
      costPerUnit: 45,
      supplier: 'Rice Supplier Inc.',
      lastRestocked: new Date('2025-01-05'),
      category: 'others'
    },
    {
      id: '2',
      name: 'Chicken Breast',
      currentStock: 5,
      minimumStock: 8,
      unit: 'kg',
      costPerUnit: 180,
      supplier: 'Fresh Meat Co.',
      lastRestocked: new Date('2025-01-07'),
      expiryDate: new Date('2025-01-12'),
      category: 'meat'
    },
    {
      id: '3',
      name: 'Tomatoes',
      currentStock: 3,
      minimumStock: 5,
      unit: 'kg',
      costPerUnit: 60,
      supplier: 'Vegetable Market',
      lastRestocked: new Date('2025-01-08'),
      expiryDate: new Date('2025-01-15'),
      category: 'vegetables'
    },
    {
      id: '4',
      name: 'Cooking Oil',
      currentStock: 15,
      minimumStock: 5,
      unit: 'liters',
      costPerUnit: 120,
      supplier: 'Oil Distributor',
      lastRestocked: new Date('2025-01-06'),
      category: 'others'
    }
  ];

  filteredItems: InventoryItem[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.filteredItems = this.inventoryItems;
  }

  filterItems() {
    let filtered = this.inventoryItems;

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    if (this.searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredItems = filtered;
  }

  getLowStockItems() {
    return this.inventoryItems.filter(item => item.currentStock <= item.minimumStock);
  }

  getExpiringItems() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return this.inventoryItems.filter(item => 
      item.expiryDate && item.expiryDate <= threeDaysFromNow
    );
  }

  async addStock(item: InventoryItem) {
    const alert = await this.alertController.create({
      header: 'Add Stock',
      message: `Add stock for ${item.name}`,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Enter quantity to add',
          min: 1
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.quantity && data.quantity > 0) {
              item.currentStock += parseInt(data.quantity);
              item.lastRestocked = new Date();
              this.showToast(`Added ${data.quantity} ${item.unit} to ${item.name}`, 'success');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async removeStock(item: InventoryItem) {
    const alert = await this.alertController.create({
      header: 'Remove Stock',
      message: `Remove stock for ${item.name}`,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Enter quantity to remove',
          min: 1,
          max: item.currentStock
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: (data) => {
            if (data.quantity && data.quantity > 0 && data.quantity <= item.currentStock) {
              item.currentStock -= parseInt(data.quantity);
              this.showToast(`Removed ${data.quantity} ${item.unit} from ${item.name}`, 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getStockStatus(item: InventoryItem): string {
    if (item.currentStock <= item.minimumStock) return 'danger';
    if (item.currentStock <= item.minimumStock * 1.5) return 'warning';
    return 'success';
  }

  getTotalInventoryValue(): number {
    return this.inventoryItems.reduce((total, item) => 
      total + (item.currentStock * item.costPerUnit), 0
    );
  }

  formatPhp(amount: number): string {
    return this.menuService.formatPhp(amount);
  }

  isExpiringSoon(expiryDate: Date): boolean {
    if (!expiryDate) return false;
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return expiryDate <= threeDaysFromNow;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
