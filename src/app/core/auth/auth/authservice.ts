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

  // TODO: Replace with actual EmailJS credentials
  private serviceID = 'YOUR_SERVICE_ID';
  private templateID = 'YOUR_TEMPLATE_ID';
  private publicKey = 'YOUR_PUBLIC_KEY';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    // Initialize EmailJS
    emailjs.init(this.publicKey);
  }

  get currentUser(): Observable<any> {
    return from(this.supabase.auth.getUser());
  }

  private async sendAdminNotification(action: 'register' | 'login', userData: any) {
    const templateParams = {
      to_name: 'Admin',
      from_name: 'E-Learning App',
      message: `User ${action} successful.\nName: ${userData.name || 'N/A'}\nEmail: ${userData.email}`,
      user_action: action,
      user_name: userData.name || 'N/A',
      user_email: userData.email,
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
  