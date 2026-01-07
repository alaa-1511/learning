import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Translate } from '../../core/service/translate';
import { TranslateModule } from '@ngx-translate/core';
import { Flowbit } from '../../core/service/flowbite/flowbit';
import { initFlowbite } from 'flowbite';
import { Authservice } from '../../core/auth/auth/authservice';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly translateService = inject(Translate);
  private readonly authService = inject(Authservice);
  private readonly router = inject(Router);

  isSidebarOpen = true;
  isUserMenuOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  changeLanguage(lang: string) {
    this.translateService.changeLanguage(lang);
    this.isUserMenuOpen = false; // Close menu after selection
  }

  logout() {
    this.router.navigate(['/landing']);
  }
}
