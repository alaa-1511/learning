import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vat',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './vat.html',
})
export class VAT {}
