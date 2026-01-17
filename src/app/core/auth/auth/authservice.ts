import { inject, Injectable, signal } from '@angular/core';
import { from, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root',
})
export class Authservice {
  private supabase: SupabaseClient;

  private serviceID = 'service_uhvwfbb';
  private templateID = 'template_9kqzzu5';
  private publicKey = 'HmVEfd9rlmh1aBHI4';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    // Initialize EmailJs
    emailjs.init(this.publicKey);
  }

  get currentUser(): Observable<any> {
    return from(this.supabase.auth.getUser());
  }

  private async sendAdminNotification(action: 'register' | 'login', userData: any) {
    const fullName = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : (userData.name || 'N/A');
    const phone = userData.phone || 'N/A';
    
    const templateParams = {
      to_name: 'Admin',
      from_name: 'E-Learning App',
      message: `User ${action} successful.\nName: ${fullName}\nEmail: ${userData.email}\nPhone: ${phone}`,
      user_action: action,
      user_name: fullName,
      user_email: userData.email,
      user_phone: phone
    };

    try {
      await emailjs.send(this.serviceID, this.templateID, templateParams);
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Failed to send admin notification', error);
    }
  }

  register(data: any): Observable<any> {
    const { email, password, ...rest } = data;
    return from(
      this.supabase.auth.signUp({
        email,
        password,
        options: { data: rest },
      })
    ).pipe(
      tap((response: any) => {
        if (!response.error && response.data?.user) {
          const userData = { email: response.data.user.email, ...response.data.user.user_metadata };
          this.sendAdminNotification('register', userData);
        }
      })
    );
  }
  


  login(data: any): Observable<any> {
    const { email, password } = data;
    return from(
      this.supabase.auth.signInWithPassword({
        email,
        password,
      })
    ).pipe(
      tap((response: any) => {
        if (!response.error && response.data?.user) {
           const userData = { email: response.data.user.email, ...response.data.user.user_metadata };
           this.sendAdminNotification('login', userData);
        }
      })
    );
  }
  
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
  