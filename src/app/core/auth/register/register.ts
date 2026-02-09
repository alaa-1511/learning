import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Authservice } from '../auth/authservice';
import { Router, RouterLink } from '@angular/router';
import { Input } from '../../../shared/components/input/input';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [ ReactiveFormsModule ,Input, TranslateModule ,RouterLink    ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  
  private readonly authservice = inject(Authservice);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);


  isLoading = signal<boolean>(false);
  
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  formRegisterData = signal<FormGroup>(this.fb.group({
    firstName: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    lastName: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: [null, [Validators.required, Validators.email]],
    phone: [null, [Validators.required, Validators.pattern(/^(01)(0|1|2|5)[0-9]{8}$/)]],
    password: [null, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/)]],
    retypePassword: [null, [Validators.required, Validators.minLength(8)]],
    
  },{validator: this.conformpassword})


);


  conformpassword(group: AbstractControl) {
    const password = group.get('password')?.value;
    const retypePassword = group.get('retypePassword')?.value;
    const retypeControl = group.get('retypePassword');

    if (password !== retypePassword) {
      retypeControl?.setErrors({ ...retypeControl.errors, conformpassword: true });
      return { conformpassword: true };
    }

    if (retypeControl?.hasError('conformpassword')) {
      const errors = { ...retypeControl.errors };
      delete errors['conformpassword'];
      retypeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return null;
  }


  formRegister(): void {
    if (this.formRegisterData().valid) {
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.isLoading.set(true);
        // Toastr for immediate feedback (optional, maybe remove if redundant with successMessage)
        
        this.authservice.register(this.formRegisterData().value).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                console.log(res);
                
                if (res.error) {
                    if (res.error.message.includes('rate limit')) {
                        const msg = this.translate.instant('AUTH.ERROR.TOO_MANY_ATTEMPTS');
                        this.errorMessage.set(msg);
                    } else {
                        this.errorMessage.set(res.error.message);
                    }
                    return;
                }

                if (res.data.user && !res.data.session) {
                    const msg = this.translate.instant('AUTH.REGISTRATION_SUCCESS');
                    this.successMessage.set(msg);
                    this.toastr.success(msg);
                    this.formRegisterData().reset();
                } else if (res.data.session) {
                     localStorage.setItem('token', res.data.session.access_token);
                     this.formRegisterData().reset();
                     this.route.navigate(['/login']);
                     const msg = this.translate.instant('AUTH.REGISTRATION_SUCCESS');
                     this.toastr.success(msg);
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                console.log(err);
                const msg = this.translate.instant('AUTH.ERROR.UNEXPECTED');
                this.errorMessage.set(msg);
                this.toastr.error(msg);
            },
        });
    } else {
        this.formRegisterData().markAllAsTouched();
    }
  }


}
