import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ifrs',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './ifrs.html',
})
export class IFRS {}
