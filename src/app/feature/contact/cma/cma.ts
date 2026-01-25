import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cma',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cma.html',
  styleUrl: './cma.css',
})
export class CMA {

}
