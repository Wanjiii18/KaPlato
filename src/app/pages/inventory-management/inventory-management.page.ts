import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { InventoryService, InventoryItem, InventoryStats, CreateInventoryData } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.page.html',
  styleUrls: ['./inventory-management.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class InventoryManagementPage implements OnInit {
  inventoryItems: InventoryItem[] = [];
  stats: InventoryStats = {
    total_items: 0,
    total_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    categories: []
  };
  isLoading = false;
  selectedSegment = 'inventory';
  filteredItems: InventoryItem[] = [];
  selectedCategory = 'all';

  constructor(
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.checkAuthentication();
    this.loadInventory();
  }

  private checkAuthentication() {
    const token = sessionStorage.getItem('auth_token');
    console.log('Auth token exists:', !!token);
    
    if (!token) {
      console.error('No authentication token found');
      this.showToast('Please log in to access inventory management', 'danger');
    }
  }

  async loadInventory() {
    this.isLoading = true;
    try {
      const response = await this.inventoryService.getInventory().toPromise();
      this.inventoryItems = response.data || [];
      this.stats = response.stats || this.stats;
      this.applyFilter();
      
      if (this.inventoryItems.length === 0) {
        this.showToast('No inventory items found. Start by adding some ingredients!', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      
      if (error.status === 401) {
        this.showToast('Authentication failed. Please log in again.', 'danger');
      } else if (error.status === 403) {
        this.showToast('Access denied. You need a karenderia account to manage inventory.', 'danger');
      } else if (error.status === 0) {
        this.showToast('Unable to connect to server. Please check your internet connection.', 'danger');
      } else {
        this.showToast('Error loading inventory. Please try again.', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  onSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    if (this.selectedSegment === 'alerts') {
      this.loadAlerts();
    }
  }

  async loadAlerts() {
    try {
      const response = await this.inventoryService.getLowStockAlerts().toPromise();
      // Handle alerts if needed
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      this.showToast('Error loading stock alerts', 'danger');
    }
  }

  onCategoryChanged(event: any) {
    this.selectedCategory = event.detail.value;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedCategory === 'all') {
      this.filteredItems = this.inventoryItems;
    } else {
      this.filteredItems = this.inventoryItems.filter(item => 
        item.category.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'danger';
      case 'expired': return 'dark';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'available': return 'checkmark-circle';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'close-circle';
      case 'expired': return 'time';
      default: return 'help-circle';
    }
  }

  async addInventoryItem() {
    const alert = await this.alertController.create({
      header: 'Add Inventory Item',
      inputs: [
        {
          name: 'item_name',
          type: 'text',
          placeholder: 'Item Name (e.g., Chicken Breast)',
          attributes: { required: true }
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Category (e.g., Protein)',
          attributes: { required: true }
        },
        {
          name: 'unit',
          type: 'text',
          placeholder: 'Unit (e.g., kg, pieces)',
          attributes: { required: true }
        },
        {
          name: 'current_stock',
          type: 'number',
          placeholder: 'Current Stock',
          attributes: { required: true, min: 0, step: 0.001 }
        },
        {
          name: 'minimum_stock',
          type: 'number',
          placeholder: 'Minimum Stock Alert',
          attributes: { required: true, min: 0, step: 0.001 }
        },
        {
          name: 'unit_cost',
          type: 'number',
          placeholder: 'Cost per Unit (₱)',
          attributes: { required: true, min: 0, step: 0.01 }
        },
        {
          name: 'supplier',
          type: 'text',
          placeholder: 'Supplier (optional)'
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
            this.createInventoryItem(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async createInventoryItem(data: any) {
    const loading = await this.loadingController.create({
      message: 'Adding inventory item...'
    });
    await loading.present();

    try {
      const inventoryData: CreateInventoryData = {
        item_name: data.item_name,
        category: data.category,
        unit: data.unit,
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        unit_cost: parseFloat(data.unit_cost),
        supplier: data.supplier || undefined
      };

      await this.inventoryService.createInventoryItem(inventoryData).toPromise();
      this.showToast('Inventory item added successfully!', 'success');
      this.loadInventory();
    } catch (error: any) {
      console.error('Error creating inventory item:', error);
      this.showToast('Failed to add inventory item. Please try again.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async restockItem(item: InventoryItem) {
    const alert = await this.alertController.create({
      header: `Restock ${item.item_name}`,
      message: `Current stock: ${item.current_stock} ${item.unit}`,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantity to add',
          attributes: { required: true, min: 0.001, step: 0.001 }
        },
        {
          name: 'unit_cost',
          type: 'number',
          placeholder: `Unit Cost (Current: ₱${item.unit_cost})`,
          value: (item.unit_cost?.toString() || '0'),
          attributes: { min: 0, step: 0.01 }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Restock',
          handler: async (data) => {
            if (data.quantity && parseFloat(data.quantity) > 0) {
              await this.performRestock(item.id, parseFloat(data.quantity), parseFloat(data.unit_cost));
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async performRestock(itemId: number, quantity: number, unitCost: number) {
    const loading = await this.loadingController.create({
      message: 'Restocking item...'
    });
    await loading.present();

    try {
      await this.inventoryService.restockItem(itemId, quantity, unitCost).toPromise();
      this.showToast('Item restocked successfully!', 'success');
      this.loadInventory();
    } catch (error: any) {
      console.error('Error restocking item:', error);
      this.showToast('Failed to restock item. Please try again.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async deleteItem(item: InventoryItem) {
    const alert = await this.alertController.create({
      header: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${item.item_name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.performDelete(item.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async performDelete(itemId: number) {
    const loading = await this.loadingController.create({
      message: 'Deleting item...'
    });
    await loading.present();

    try {
      await this.inventoryService.deleteInventoryItem(itemId).toPromise();
      this.showToast('Item deleted successfully!', 'success');
      this.loadInventory();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      if (error.status === 400) {
        this.showToast('Cannot delete item that is linked to daily menu items.', 'warning');
      } else {
        this.showToast('Failed to delete item. Please try again.', 'danger');
      }
    } finally {
      loading.dismiss();
    }
  }

  // ADD NEW ITEM FUNCTIONALITY
  async addNewItem() {
    const alert = await this.alertController.create({
      header: 'Add New Inventory Item',
      inputs: [
        {
          name: 'item_name',
          type: 'text',
          placeholder: 'Item Name *',
          attributes: {
            required: true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)'
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Category *',
          value: 'Food',
          attributes: {
            required: true
          }
        },
        {
          name: 'unit',
          type: 'text',
          placeholder: 'Unit (kg, pcs, liters, etc.) *',
          attributes: {
            required: true
          }
        },
        {
          name: 'current_stock',
          type: 'number',
          placeholder: 'Current Stock *',
          min: 0,
          attributes: {
            required: true
          }
        },
        {
          name: 'minimum_stock',
          type: 'number',
          placeholder: 'Minimum Stock Level *',
          min: 0,
          attributes: {
            required: true
          }
        },
        {
          name: 'maximum_stock',
          type: 'number',
          placeholder: 'Maximum Stock Level (optional)',
          min: 0
        },
        {
          name: 'unit_cost',
          type: 'number',
          placeholder: 'Cost per Unit *',
          min: 0,
          attributes: {
            required: true,
            step: '0.01'
          }
        },
        {
          name: 'supplier',
          type: 'text',
          placeholder: 'Supplier (optional)'
        },
        {
          name: 'expiry_date',
          type: 'date',
          placeholder: 'Expiry Date (optional)'
        },
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Additional Notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add Item',
          handler: (data) => {
            this.performAddItem(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async performAddItem(data: any) {
    // Validate required fields
    if (!data.item_name || !data.category || !data.unit || 
        data.current_stock === undefined || data.minimum_stock === undefined || 
        data.unit_cost === undefined) {
      this.showToast('Please fill in all required fields', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Adding new item...'
    });
    await loading.present();

    try {
      const newItem = {
        item_name: data.item_name.trim(),
        description: data.description ? data.description.trim() : undefined,
        category: data.category.trim(),
        unit: data.unit.trim(),
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        maximum_stock: data.maximum_stock ? parseFloat(data.maximum_stock) : undefined,
        unit_cost: parseFloat(data.unit_cost),
        supplier: data.supplier ? data.supplier.trim() : undefined,
        expiry_date: data.expiry_date || undefined,
        notes: data.notes ? data.notes.trim() : undefined
      };

      await this.inventoryService.createInventoryItem(newItem).toPromise();
      this.showToast('Inventory item added successfully!', 'success');
      this.loadInventory();
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      if (error.status === 400) {
        this.showToast('Invalid data. Please check your inputs.', 'danger');
      } else {
        this.showToast('Failed to add inventory item. Please try again.', 'danger');
      }
    } finally {
      loading.dismiss();
    }
  }

  // EDIT ITEM FUNCTIONALITY
  async editItem(item: InventoryItem) {
    const alert = await this.alertController.create({
      header: 'Edit Inventory Item',
      subHeader: `Update details for "${item.item_name}"`,
      inputs: [
        {
          name: 'item_name',
          type: 'text',
          placeholder: 'Item Name *',
          value: item.item_name,
          attributes: {
            required: true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description',
          value: item.description || ''
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Category *',
          value: item.category,
          attributes: {
            required: true
          }
        },
        {
          name: 'unit',
          type: 'text',
          placeholder: 'Unit *',
          value: item.unit,
          attributes: {
            required: true
          }
        },
        {
          name: 'current_stock',
          type: 'number',
          placeholder: 'Current Stock *',
          value: (item.current_stock?.toString() || '0'),
          min: 0,
          attributes: {
            required: true
          }
        },
        {
          name: 'minimum_stock',
          type: 'number',
          placeholder: 'Minimum Stock Level *',
          value: (item.minimum_stock?.toString() || '0'),
          min: 0,
          attributes: {
            required: true
          }
        },
        {
          name: 'maximum_stock',
          type: 'number',
          placeholder: 'Maximum Stock Level',
          value: item.maximum_stock?.toString() || '',
          min: 0
        },
        {
          name: 'unit_cost',
          type: 'number',
          placeholder: 'Cost per Unit *',
          value: (item.unit_cost?.toString() || '0'),
          min: 0,
          attributes: {
            required: true,
            step: '0.01'
          }
        },
        {
          name: 'supplier',
          type: 'text',
          placeholder: 'Supplier',
          value: item.supplier || ''
        },
        {
          name: 'expiry_date',
          type: 'date',
          placeholder: 'Expiry Date',
          value: item.expiry_date ? item.expiry_date.split('T')[0] : ''
        },
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Additional Notes',
          value: item.notes || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update Item',
          handler: (data) => {
            this.performEditItem(item.id, data);
          }
        }
      ]
    });

    await alert.present();
  }

  async performEditItem(itemId: number, data: any) {
    // Validate required fields
    if (!data.item_name || !data.category || !data.unit || 
        data.current_stock === undefined || data.minimum_stock === undefined || 
        data.unit_cost === undefined) {
      this.showToast('Please fill in all required fields', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating item...'
    });
    await loading.present();

    try {
      const updateData = {
        item_name: data.item_name.trim(),
        description: data.description ? data.description.trim() : undefined,
        category: data.category.trim(),
        unit: data.unit.trim(),
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        maximum_stock: data.maximum_stock ? parseFloat(data.maximum_stock) : undefined,
        unit_cost: parseFloat(data.unit_cost),
        supplier: data.supplier ? data.supplier.trim() : undefined,
        expiry_date: data.expiry_date || undefined,
        notes: data.notes ? data.notes.trim() : undefined
      };

      await this.inventoryService.updateInventoryItem(itemId, updateData).toPromise();
      this.showToast('Inventory item updated successfully!', 'success');
      this.loadInventory();
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      if (error.status === 400) {
        this.showToast('Invalid data. Please check your inputs.', 'danger');
      } else {
        this.showToast('Failed to update inventory item. Please try again.', 'danger');
      }
    } finally {
      loading.dismiss();
    }
  }

  // VIEW ITEM DETAILS
  async viewItemDetails(item: InventoryItem) {
    try {
      console.log('View item details called for:', item);
      
      // Convert values to numbers safely
      const unitCost = parseFloat(item.unit_cost?.toString() || '0') || 0;
      const totalValue = parseFloat(item.total_value?.toString() || '0') || 0;
      const currentStock = parseFloat(item.current_stock?.toString() || '0') || 0;
      const minStock = parseFloat(item.minimum_stock?.toString() || '0') || 0;
      const maxStock = item.maximum_stock ? parseFloat(item.maximum_stock.toString()) : null;
      
      const alert = await this.alertController.create({
        header: item.item_name || 'Item Details',
        subHeader: `Category: ${item.category || 'Unknown'}`,
        message: `
          <div class="item-details">
            <p><strong>Description:</strong> ${item.description || 'No description'}</p>
            <p><strong>Current Stock:</strong> ${currentStock} ${item.unit || 'units'}</p>
            <p><strong>Stock Level:</strong> Min: ${minStock}, Max: ${maxStock || 'N/A'}</p>
            <p><strong>Unit Cost:</strong> ₱${unitCost.toFixed(2)}</p>
            <p><strong>Total Value:</strong> ₱${totalValue.toFixed(2)}</p>
            <p><strong>Status:</strong> ${item.status ? item.status.replace('_', ' ').toUpperCase() : 'Unknown'}</p>
            ${item.supplier ? `<p><strong>Supplier:</strong> ${item.supplier}</p>` : ''}
            ${item.expiry_date ? `<p><strong>Expires:</strong> ${new Date(item.expiry_date).toLocaleDateString()}</p>` : ''}
            ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            ${item.updated_at ? `<p><strong>Last Updated:</strong> ${new Date(item.updated_at).toLocaleDateString()}</p>` : ''}
          </div>
        `,
        buttons: [
          {
            text: 'Edit',
            handler: () => {
              this.editItem(item);
            }
          },
          {
            text: 'Restock',
            handler: () => {
              this.restockItem(item);
            }
          },
          {
            text: 'Close'
          }
        ]
      });

      console.log('Alert created, presenting...');
      await alert.present();
      console.log('Alert presented successfully');
      
    } catch (error) {
      console.error('Error in viewItemDetails:', error);
      this.showToast('Error displaying item details', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
