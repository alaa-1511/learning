import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CertificateLayoutComponent } from '../certificate-layout/certificate-layout.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-certificate',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule, CommonModule],
  template: `
    <app-certificate-layout
      [image]="('CERTIFICATES_PAGE.DETAILS.' + type + '.IMAGE' | translate)"
      [title]="'CERTIFICATES_PAGE.DETAILS.' + type + '.TITLE' | translate"
      [subtitle]="'CERTIFICATES_PAGE.DETAILS.' + type + '.SUBTITLE' | translate"
      [description]="'CERTIFICATES_PAGE.DETAILS.' + type + '.DESC' | translate"
      [targetAudience]="'CERTIFICATES_PAGE.DETAILS.' + type + '.AUDIENCE' | translate"
      [requirements]="'CERTIFICATES_PAGE.DETAILS.' + type + '.REQ' | translate"
      [topics]="'CERTIFICATES_PAGE.DETAILS.' + type + '.TOPICS' | translate"
      [whyChooseData]="'CERTIFICATES_PAGE.DETAILS.' + type + '.WHY_CHOOSE' | translate"
    ></app-certificate-layout>
  `
})
export class GenericCertificateComponent implements OnInit {
  type: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.type = data['type'];
    });
  }
}
