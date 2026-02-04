import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor(private spinner: NgxSpinnerService) {
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      this.spinner.show();
      try {
        return await fetch(input, init);
      } finally {
        this.spinner.hide();
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
