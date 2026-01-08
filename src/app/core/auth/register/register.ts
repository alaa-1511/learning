import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../auth/authservice';
import { Router, RouterLink } from '@angular/router';
import { Input } from '../../../shared/components/input/input';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [ ReactiveFormsModule ,Input, TranslateModule ,RouterLink    ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  
   private readonly authservice = inject(Authservice);
  private readonly fb = inject(FormBuilder);
  private readonly route=inject(Router)
  private readonly toastr = inject(ToastrService);


isLoading = signal<boolean>(false);
  
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  formRegisterData = signal<FormGroup>(this.fb.group({
   firstName: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    lastName: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: [null, [Validators.required, Validators.email]],
    password: [null, [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/)
]],
    
  }));


  formRegister(): void {
    if (this.formRegisterData().valid) {
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.isLoading.set(true);
        this.toastr.success('Registration successful! Please check your email to confirm your account before logging in.');
        
        this.authservice.register(this.formRegisterData().value).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                console.log(res);
                
                if (res.error) {
                    if (res.error.message.includes('rate limit')) {
                        this.errorMessage.set('Too many registration attempts. Please wait 1 hour before trying again.');
                    } else {
                        this.errorMessage.set(res.error.message);
                    }
                    return;
                }

                if (res.data.user && !res.data.session) {
                    this.successMessage.set('Registration successful! Please check your email to confirm your account before logging in.');
                    this.formRegisterData().reset();
                } else if (res.data.session) {
                     localStorage.setItem('token', res.data.session.access_token);
                     this.formRegisterData().reset();
                     this.route.navigate(['/login']);
                     this.toastr.success('Registration successful! Please check your email to confirm your account before logging in.');
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                console.log(err);
                this.errorMessage.set('An unexpected error occurred. Please try again.');
                this.toastr.error('An unexpected error occurred. Please try again.');
            },
        });
    } else {
        this.formRegisterData().markAllAsTouched();
    }
  }


}
