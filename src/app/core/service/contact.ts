import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private supabase: SupabaseClient;

  
  private serviceID = 'service_uhvwfbb';
  private templateID = 'template_9kqzzu5';
  private publicKey = 'HmVEfd9rlmh1aBHI4';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async sendContact(data: any) {
    return await this.supabase.from('contacts').insert([data]);
  }

  async sendEmail(data: any) {
    return await emailjs.send(this.serviceID, this.templateID, data, this.publicKey);
  }
}
