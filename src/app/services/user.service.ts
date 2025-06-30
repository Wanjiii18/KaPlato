import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, DocumentReference, setDoc } from '@angular/fire/firestore';
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
    private authService: AuthService,
    private zone: NgZone // Inject NgZone
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
    console.log('Loading user profile for UID:', uid);
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnapshot = await this.zone.run(() => getDoc(userDocRef));

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as UserProfile;
        console.log('User profile found:', userData);
        this.currentUserProfileSubject.next(userData);
      } else {
        console.warn('User profile not found for UID:', uid, 'Creating a new one.');
        // Get the user from auth to get their email and display name
        const user = this.authService.getCurrentUser();
        if (user) {
          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'New User',
            username: user.displayName?.toLowerCase() || 'newuser',
            role: 'user',
            createdAt: new Date(),
          };
          // Create the document in Firestore
          await this.zone.run(() => setDoc(userDocRef, newUserProfile));
          // Emit the new profile
          this.currentUserProfileSubject.next(newUserProfile);
          console.log('New user profile created:', newUserProfile);
        } else {
          this.currentUserProfileSubject.next(null); // No authenticated user found
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.currentUserProfileSubject.next(null); // Also emit null on error
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await this.zone.run(() => updateDoc(userDoc, updates));
      
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
