import { Component, inject, input, InputSignal, signal } from '@angular/core';
import { Flowbit } from '../../../core/service/flowbite/flowbit';
import { initFlowbite } from 'flowbite';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { Translate } from '../../../core/service/translate';
import { FormsModule } from '@angular/forms';
import { Authservice } from '../../../core/auth/auth/authservice';
import { SpecailEmail } from '../../../core/service/specailemail';

@Component({
  selector: 'app-navbar',
  imports: [ RouterLink, TranslateModule, FormsModule, TranslatePipe ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  private readonly flowbiteService = inject(Flowbit);
  private readonly translate = inject(Translate);
  private readonly authService = inject(Authservice);
  private readonly router = inject(Router);
  private readonly specialEmail = inject(SpecailEmail);

  isAdmin = signal<boolean>(false);

  constructor() {
  }

  isLoggedIn : InputSignal<boolean> = input<boolean>(false);

  ngOnInit(): void {
    this.flowbiteService.loadFlowbite((flowbite) => {
      initFlowbite();
    });
    this.specialEmail.isAllowedUser().then(allowed => {
      this.isAdmin.set(allowed);
    });
  }

 

  switchLanguage(language: string) {
    this.translate.changeLanguage(language);
  }

  logout() {
    this.authService.signOut().then(() => {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    });
  }

 
  
}