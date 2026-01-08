import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Authservice } from '../auth/authservice';
import { Input } from '../../../shared/components/input/input';
import { SpecailEmail } from '../../service/specailemail';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule ,Input, TranslateModule ,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private readonly fb = inject(FormBuilder);
  private readonly authservice = inject(Authservice);
  private readonly specailemail = inject(SpecailEmail);
  private readonly route = inject(Router);
  private readonly toastr = inject(ToastrService);

  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  formLoginData = signal<FormGroup>(this.fb.group({
    email: [null, [Validators.required, Validators.email]],
    password: [null, [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/)]],
  }));

  formLogin(): void {
    if (this.formLoginData().valid) {
      this.errorMessage.set(null);
      const { email, password } = this.formLoginData().value;

      this.specailemail.isSpecialEmail(email).subscribe((isSpecial) => {
        if (isSpecial) {
          // Special User Login
          this.specailemail.login(email, password).then(
            (data) => {
               if (data.session) {
                  localStorage.setItem('token', data.session.access_token);
                  this.formLoginData().reset();
                  this.route.navigate(['/landing']);
                  this.toastr.success('Login successful');
                  this.isLoading.set(false);
               }
            }
          ).catch((err) => {
             console.error('Login failed:', err);
             this.errorMessage.set(err.message || 'Login failed');
             this.toastr.error('Login failed');
             this.isLoading.set(false);
          });

        } else {
          // Regular User Login
          this.authservice.login(this.formLoginData().value).subscribe({
            next: (res: any) => {
              if (res.data.session) {
                localStorage.setItem('token', res.data.session.access_token);
                this.formLoginData().reset();
                this.route.navigate(['/landing']);
                this.toastr.success('Login successful');
                this.isLoading.set(false);
              } else if (res.error) {
                console.error('Login failed:', res.error.message);
                this.errorMessage.set(res.error.message);
                this.toastr.error('Login failed');
                this.isLoading.set(false);
              }
            },
            error: (err: any) => {
              console.log(err);
              this.errorMessage.set('An unexpected error occurred. Please try again.');
            },
          });
        }
      });

    } else {
      this.formLoginData().markAllAsTouched();
    }
  }
 
}


 


