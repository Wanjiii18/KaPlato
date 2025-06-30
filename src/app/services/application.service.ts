import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, query, where, getDocs, orderBy, limit } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

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
  private applicationsCollection = collection(this.firestore, 'karenderia_applications');

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  // Submit a new karenderia application
  async submitApplication(
    applicationData: Omit<KarenderiaApplication, 'id' | 'submittedAt' | 'applicationStatus' | 'businessPermitImageUrl'>,
    businessPermitFile: File
  ): Promise<string> {
    try {
      // Upload business permit image
      const businessPermitUrl = await this.uploadBusinessPermit(businessPermitFile, applicationData.applicantId);
      
      // Create application document
      const application: Omit<KarenderiaApplication, 'id'> = {
        ...applicationData,
        businessPermitImageUrl: businessPermitUrl,
        applicationStatus: 'pending',
        submittedAt: new Date()
      };

      const docRef = await addDoc(this.applicationsCollection, application);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  // Upload business permit image to Firebase Storage
  private async uploadBusinessPermit(file: File, applicantId: string): Promise<string> {
    try {
      const fileName = `business_permits/${applicantId}_${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading business permit:', error);
      throw error;
    }
  }

  // Get applications by applicant ID
  getApplicationsByApplicant(applicantId: string): Observable<KarenderiaApplication[]> {
    const q = query(
      this.applicationsCollection,
      where('applicantId', '==', applicantId),
      orderBy('submittedAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as KarenderiaApplication))
      )
    );
  }

  // Get all pending applications (for admin)
  getPendingApplications(): Observable<KarenderiaApplication[]> {
    const q = query(
      this.applicationsCollection,
      where('applicationStatus', '==', 'pending'),
      orderBy('submittedAt', 'asc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as KarenderiaApplication))
      )
    );
  }

  // Get all applications (for admin)
  getAllApplications(): Observable<KarenderiaApplication[]> {
    const q = query(
      this.applicationsCollection,
      orderBy('submittedAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as KarenderiaApplication))
      )
    );
  }

  // Approve application (admin only)
  async approveApplication(applicationId: string, adminId: string, adminNotes?: string): Promise<void> {
    try {
      const applicationDoc = doc(this.firestore, 'karenderia_applications', applicationId);
      await updateDoc(applicationDoc, {
        applicationStatus: 'approved',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        adminNotes: adminNotes || ''
      });
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
      const applicationDoc = doc(this.firestore, 'karenderia_applications', applicationId);
      await updateDoc(applicationDoc, {
        applicationStatus: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: rejectionReason,
        adminNotes: adminNotes || ''
      });
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
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting business permit image:', error);
      // Don't throw error for image deletion failures
    }
  }
}
