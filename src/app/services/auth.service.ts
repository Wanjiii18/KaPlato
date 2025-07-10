import { Injectable, NgZone } from '@angular/core';
import { Auth, User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface Allergen {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  addedAt: any; // Allow for Firestore Timestamp
}

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  meals: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
    snacks?: string[];
  };
  startDate: any; // Allow for Firestore Timestamp
  endDate: any; // Allow for Firestore Timestamp
  isActive: boolean;
  createdAt: any; // Allow for Firestore Timestamp
  updatedAt: any; // Allow for Firestore Timestamp
  notes?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'karenderia_owner' | 'admin';
  createdAt: any; // Allow for Firestore Timestamp
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  // User profile features
  allergens?: Allergen[];
  mealPlans?: MealPlan[];
  preferences?: {
    dietaryRestrictions?: string[];
    cuisinePreferences?: string[];
    budgetRange?: { min: number; max: number };
  };
  // For karenderia owners
  businessName?: string;
  businessPermitNumber?: string;
  businessPermitImageUrl?: string;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
  applicationSubmittedAt?: any; // Allow for Firestore Timestamp
  reviewedAt?: any; // Allow for Firestore Timestamp
  reviewedBy?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone // Inject NgZone
  ) {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.zone.run(() => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        this.currentUserSubject.next(user);
      });
    });
  }

  // Register with email and password
  async register(email: string, password: string, username: string, role: 'user' | 'karenderia_owner' = 'user'): Promise<void> {
    try {
      console.log('� Starting mobile registration process...');
      console.log('📧 Email:', email);
      console.log('👤 Username:', username);
      console.log('🎭 Role:', role);
      
      // Check network connectivity for mobile
      const isOnline = navigator.onLine;
      console.log('🌐 Network status:', isOnline ? 'Online' : 'Offline');
      
      if (!isOnline) {
        throw new Error('No internet connection. Please check your connection and try again.');
      }
      
      // Step 1: Create Firebase Auth account (this is the critical part)
      console.log('🔐 Creating Firebase Auth account...');
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Firebase Auth account created successfully!');
      
      // Step 2: Update profile (less critical)
      try {
        console.log('👤 Updating user profile...');
        await updateProfile(userCredential.user, {
          displayName: username
        });
        console.log('✅ User profile updated in Firebase Auth');
      } catch (profileError) {
        console.warn('⚠️ Could not update profile, but account was created:', profileError);
      }

      // Step 3: Save to Firestore (less critical, can be done later)
      try {
        console.log('💾 Saving user data to Firestore...');
        const userProfile: UserProfile = {
          uid: userCredential.user.uid,
          username: username.toLowerCase(),
          email: email,
          displayName: username,
          role: role,
          createdAt: new Date(),
          isVerified: false,
          applicationStatus: role === 'karenderia_owner' ? 'pending' : undefined
        };

        await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userProfile);
        console.log('✅ User profile saved to Firestore');
      } catch (firestoreError) {
        console.warn('⚠️ Could not save to Firestore, but account was created:', firestoreError);
        // Account is still created in Firebase Auth, just missing Firestore profile
        // This can be created later when the user first logs in
      }
      
      // Step 4: Sign out the user (don't auto-login)
      try {
        console.log('🚪 Signing out user - no auto-login...');
        await signOut(this.auth);
        console.log('✅ User signed out successfully');
      } catch (signOutError) {
        console.warn('⚠️ Could not sign out, but registration was successful:', signOutError);
      }
      
      console.log('🎉 Mobile registration completed successfully! User needs to log in manually.');
      // Don't navigate to home, let the calling component handle the success message
      
    } catch (error: any) {
      console.error('❌ Mobile registration failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Handle specific Firebase Auth errors for mobile
      if (error.code) {
        const friendlyMessage = this.getMobileErrorMessage(error.code);
        console.log('🔄 Throwing mobile-friendly error:', friendlyMessage);
        throw new Error(friendlyMessage);
      }
      
      // Fallback for unexpected errors
      const fallbackMessage = error.message || 'Registration failed. Please check your internet connection and try again.';
      console.log('🔄 Throwing fallback error:', fallbackMessage);
      throw new Error(fallbackMessage);
    }
  }

  // Login with email or username and password
  async login(emailOrUsername: string, password: string): Promise<void> {
    try {
      console.log('🔄 Starting login process...');
      console.log('📝 Input:', emailOrUsername);
      let email = emailOrUsername;

      // If it doesn't contain @, treat it as username and get the email
      if (!emailOrUsername.includes('@')) {
        console.log('🔍 Treating as username, looking up email...');
        try {
          const foundEmail = await this.getEmailByUsername(emailOrUsername);
          if (!foundEmail) {
            throw new Error('Username not found. Please check your username or try using your email address instead.');
          }
          email = foundEmail;
          console.log('✅ Found email for username');
        } catch (usernameError) {
          console.error('❌ Username lookup failed:', usernameError);
          throw new Error('Could not find account with that username. Please try using your email address instead.');
        }
      }

      console.log('🔐 Attempting login with email authentication...');
      await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Login successful! Redirecting to home...');
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('❌ Login error details:', error);
      console.error('❌ Login error code:', error.code);
      console.error('❌ Login error message:', error.message);
      
      if (error.code) {
        throw new Error(this.getErrorMessage(error.code));
      }
      
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      console.log('🔄 Logging out...');
      await signOut(this.auth);
      console.log('✅ Logout successful! Redirecting to login...');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  }

  // Get current user
  getCurrentUser(): User | null | undefined {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    return user !== null && user !== undefined;
  }

  // Check if username already exists
  private async checkUsernameExists(username: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if username exists:', username.toLowerCase());
      
      // Skip username check if user is not authenticated (during registration)
      if (!this.auth.currentUser) {
        console.log('⚠️ Skipping username check - user not authenticated yet');
        return false; // Allow registration to proceed
      }
      
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      const exists = !querySnapshot.empty;
      console.log('📊 Username exists:', exists);
      return exists;
    } catch (error: any) {
      console.error('❌ Error checking username:', error);
      console.error('❌ Error code:', error.code);
      // If there's a permission error, skip the check and allow registration
      if (error.code === 'permission-denied') {
        console.log('⚠️ Permission denied for username check, allowing registration to proceed');
        return false;
      }
      return false;
    }
  }

  // Get email by username
  private async getEmailByUsername(username: string): Promise<string | null> {
    try {
      console.log('🔍 Searching for username:', username.toLowerCase());
      
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const email = userDoc.data()['email'];
        console.log('✅ Found email for username');
        return email;
      }
      console.log('❌ Username not found in database');
      return null;
    } catch (error: any) {
      console.error('❌ Error getting email by username:', error);
      console.error('❌ Error code:', error.code);
      return null;
    }
  }

  // Get user-friendly error messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email or username. Please check your credentials or register.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email/username or password. Please check your credentials.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'permission-denied':
        return 'Database permission error. Please try again or contact support.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Get mobile-friendly error messages
  private getMobileErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Registration is currently disabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long with letters and numbers.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email or username. Please check your credentials or register.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email/username or password. Please check your credentials.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again in a few minutes.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'permission-denied':
        return 'Database access denied. Please check your internet connection and try again.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please check your connection and try again.';
      default:
        return 'Registration failed. Please check your internet connection and try again.';
    }
  }
}
