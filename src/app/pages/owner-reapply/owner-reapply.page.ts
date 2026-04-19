import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonInput, IonButton, IonIcon, IonSpinner, LoadingController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUpload, arrowBack, checkmarkCircle } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-owner-reapply',
  templateUrl: './owner-reapply.page.html',
  styleUrls: ['./owner-reapply.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonButton, IonIcon, IonSpinner
  ]
})
export class OwnerReapplyPage implements OnInit {
  reapplyForm!: FormGroup;
  businessPermitFile: File | null = null;
  permitFileError = '';
  isLoading = false;
  isSubmitting = false;
  successStep = false;
  businessName = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ cloudUpload, arrowBack, checkmarkCircle });
  }

  ngOnInit() {
    this.initForm();
    
    // Get email from query params or route state
    const email = this.activatedRoute.snapshot.queryParamMap.get('email');
    if (email) {
      this.reapplyForm.patchValue({ email });
    }
  }

  initForm() {
    this.reapplyForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onBusinessPermitSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) {
      this.permitFileError = 'No file selected';
      return;
    }

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      this.businessPermitFile = null;
      this.permitFileError = 'Only JPG, PNG, or PDF files are allowed.';
      return;
    }

    if (file.size > maxFileSize) {
      this.businessPermitFile = null;
      this.permitFileError = 'File size must be 5MB or less.';
      return;
    }

    this.businessPermitFile = file;
    this.permitFileError = '';
  }

  removeBusinessPermit(permitInput: HTMLInputElement) {
    this.businessPermitFile = null;
    this.permitFileError = '';
    permitInput.value = '';
  }

  async submitReapplication() {
    if (!this.reapplyForm.valid) {
      this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (!this.businessPermitFile) {
      this.permitFileError = 'Please upload an updated business permit before reapplying.';
      this.showToast(this.permitFileError, 'warning');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingController.create({
      message: 'Submitting your reapplication...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formData = new FormData();
      formData.append('email', this.reapplyForm.get('email')?.value);
      formData.append('business_permit_file', this.businessPermitFile);

      const response = await this.authService.reapplyOwner(formData).toPromise();

      if (response && response.success) {
        this.successStep = true;
        this.showToast('Reapplication submitted successfully!', 'success');
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Reapplication failed:', error);
      const errorMessage = error?.error?.message || 'Reapplication failed. Please try again.';
      this.showToast(errorMessage, 'danger');
    } finally {
      await loading.dismiss();
      this.isSubmitting = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
