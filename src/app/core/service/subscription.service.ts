import { Injectable, signal, inject } from '@angular/core';
import { Authservice } from '../auth/auth/authservice';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private authService = inject(Authservice);
  private router = inject(Router);
  
  showModal = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  subscribe() {
    this.closeModal();
    this.router.navigate(['/register']);
  }


  isSubscribed(user: any): boolean {
    if (!user) return false;
    
 
    
    return user.user_metadata?.isSubscribed === true;
  }
}
