import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-certificate',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule, CommonModule],
  template: `
    <app-certificate-layout></app-certificate-layout>
  `
})
export class GenericCertificateComponent {
}
