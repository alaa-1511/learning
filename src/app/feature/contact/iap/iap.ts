import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-iap',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './iap.html',
})
export class IAP {}
