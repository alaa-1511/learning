import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-frm',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './frm.html',
})
export class FRM {}
