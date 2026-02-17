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
  _topics: string[] = [];
  @Input() set topics(value: any) {
    if (Array.isArray(value)) {
      this._topics = value;
    } else {
      this._topics = [];
    }
  }
  get topics(): string[] {
    return this._topics;
  }
  @Input() image: string = '';
  @Input() whyChooseData: any = null;
  @Input() hasWhyChoose: boolean = false;
}
