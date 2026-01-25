import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-certificate-layout',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './certificate-layout.component.html',
})
export class CertificateLayoutComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() targetAudience: string = '';
  @Input() requirements: string = '';
  @Input() topics: string[] = [];
  @Input() image: string = '';
}
