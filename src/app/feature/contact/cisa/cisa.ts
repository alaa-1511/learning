import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cisa',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cisa.html',
})
export class CISA {}
