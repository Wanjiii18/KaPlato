import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, DocumentReference } from '@angular/fire/firestore';
import { AuthService, UserProfile } from './auth.service';
import { Observable, BehaviorSubject } from 'rxjs';

// Re-export UserProfile for convenience
export { UserProfile } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUserProfile$ = this.currentUserProfileSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    // Listen to auth changes and load user profile
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserProfile(user.uid);
      } else {
        this.currentUserProfileSubject.next(null);
      }
    });
  }

  // Load user profile from Firestore
  async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as UserProfile;
        this.currentUserProfileSubject.next(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, updates);
      
      // Refresh the current profile
      await this.loadUserProfile(uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get current user profile
  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfileSubject.value;
  }
}
