import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dipifrs',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './dipifrs.html',
  styleUrl: './dipifrs.css',
})
export class DIPIFRS {

}
