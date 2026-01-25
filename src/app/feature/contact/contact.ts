import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Input } from '../../shared/components/input/input';

import { ContactService } from '../../core/service/contact';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, Input, TranslateModule ,RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  contactForm!: FormGroup;

  ngOnInit(): void {
    this.initContactForm();
  }

  initContactForm() {
    this.contactForm = this.fb.group({
      firstName: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required]],
      message: [null, [Validators.required]],
    });
  }

  async onSubmit() {
    if (this.contactForm.valid) {
      try {
        await this.contactService.sendContact(this.contactForm.value);
        await this.contactService.sendEmail(this.contactForm.value);
        console.log('Contact saved and email sent successfully');
        this.contactForm.reset();
      } catch (error) {
        console.error('Error sending contact/email:', error);
      }
    } else {
      this.contactForm.markAllAsTouched();
    }
  }
}
