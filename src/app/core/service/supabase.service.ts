import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BusyService } from './busy.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor(private busyService: BusyService) {
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      this.busyService.busy();
      try {
        return await fetch(input, init);
      } finally {
        this.busyService.idle();
      }
    };

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      global: {
        fetch: customFetch
      }
    });
  }
  get client() {
    return this.supabase;
  }
}
