import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SpecailEmail {
  private supabase: SupabaseClient;
  private http = inject(HttpClient);
  private configUrl = '/admin-config.json';

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  private getAdminConfig() {
    return this.http.get<{ allowedEmail: string;
       allowedPassword: string }>(this.configUrl);
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    this.getAdminConfig().subscribe({
      next: async (config) => {
        if (email !== config.allowedEmail || password !== config.allowedPassword) {
           await this.supabase.auth.signOut();
           throw new Error('NOT_ALLOWED');
        }
      },
      error: async () => {
         // Fail safe if config cannot be loaded
          await this.supabase.auth.signOut();
          throw new Error('CONFIG_ERROR');
      }
    })

    return data;
  }

  async isAllowedUser(): Promise<boolean> {
     const { data } = await this.supabase.auth.getUser();
     if (!data.user?.email) return false;

     return new Promise((resolve) => {
        this.getAdminConfig().subscribe(config => {
           resolve(data.user!.email === config.allowedEmail);
        });
     });
  }

  isSpecialEmail(email: string): Observable<boolean> {
    return this.getAdminConfig().pipe(
      map(config => email === config.allowedEmail)
    );
  }
}
