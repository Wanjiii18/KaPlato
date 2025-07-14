import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface KarenderiaApplication {
  id?: string;
  applicantId: string;
  businessName: string;
  businessAddress: string;
  contactNumber: string;
  businessPermitNumber: string;
  businessPermitImageUrl: string;
  ownerName: string;
  description: string;
  cuisine: string[];
  operatingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
  };
  estimatedCapacity?: number;
  priceRange: 'Budget' | 'Moderate' | 'Expensive';
  applicationStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Submit new application
  async submitApplication(applicationData: Omit<KarenderiaApplication, 'id' | 'submittedAt'>, businessPermitFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('businessPermitFile', businessPermitFile);
      formData.append('applicationData', JSON.stringify(applicationData));

      const response = await this.http.post<{id: string}>(`${this.apiUrl}/karenderia/applications`, formData).toPromise();
      return response?.id || '';
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  // Get applications by applicant
  getApplicationsByApplicant(applicantId: string): Observable<KarenderiaApplication[]> {
    return this.http.get<KarenderiaApplication[]>(`${this.apiUrl}/karenderia/applications/applicant/${applicantId}`);
  }

  // Get all applications (for admin)
  getAllApplications(): Observable<KarenderiaApplication[]> {
    return this.http.get<KarenderiaApplication[]>(`${this.apiUrl}/karenderia/applications`);
  }

  // Approve application (admin only)
  async approveApplication(applicationId: string, adminId: string, adminNotes?: string): Promise<void> {
    try {
      await this.http.patch(`${this.apiUrl}/karenderia/applications/${applicationId}/approve`, {
        adminId,
        adminNotes
      }).toPromise();
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  }

  // Reject application (admin only)
  async rejectApplication(
    applicationId: string, 
    adminId: string, 
    rejectionReason: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      await this.http.patch(`${this.apiUrl}/karenderia/applications/${applicationId}/reject`, {
        adminId,
        rejectionReason,
        adminNotes
      }).toPromise();
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  }

  // Update application status and user profile when approved
  async processApprovedApplication(application: KarenderiaApplication): Promise<void> {
    try {
      // This would typically also update the user's profile to mark them as verified
      // and potentially create the karenderia record in the main collection
      console.log('Processing approved application:', application.id);
    } catch (error) {
      console.error('Error processing approved application:', error);
      throw error;
    }
  }

  // Delete business permit image (when application is deleted)
  async deleteBusinessPermitImage(imageUrl: string): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/files/business-permits`, {
        body: { imageUrl }
      }).toPromise();
    } catch (error) {
      console.error('Error deleting business permit image:', error);
      // Don't throw error for image deletion failures
    }
  }
}
