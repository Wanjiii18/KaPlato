import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'karenderia_owner' | 'admin';
  createdAt: Date;
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  // For karenderia owners
  businessName?: string;
  businessPermitNumber?: string;
  businessPermitImageUrl?: string;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
  applicationSubmittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // Listen to auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUserSubject.next(user);
    });
  }

  // Check if username already exists
  private async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  // Register with email and password
  async register(email: string, password: string, username: string, role: 'user' | 'karenderia_owner' = 'user'): Promise<void> {
    try {
      // Check if username is already taken
      const usernameExists = await this.checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('Username is already taken. Please choose a different username.');
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update user profile with username
      await updateProfile(userCredential.user, {
        displayName: username
      });

      // Store user profile in Firestore
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
      
      this.router.navigate(['/home']);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code) || error.message);
    }
  }

  // Login with email or username and password
  async login(emailOrUsername: string, password: string): Promise<void> {
    try {
      // For now, only support email login to avoid Firestore permission issues
      await signInWithEmailAndPassword(this.auth, emailOrUsername, password);
      this.router.navigate(['/home']);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code) || error.message);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Get user-friendly error messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
