import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cat',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cat.html',
  styleUrl: './cat.css',
})
export class CAT {

}
