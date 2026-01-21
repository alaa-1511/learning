import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from "../../core/layout/auth/auth";
import { Courses } from "../courses/courses";
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Contact } from "../contact/contact";

@Component({
  selector: 'app-landing',
  imports: [CommonModule, Courses, CarouselModule, TranslateModule, Contact],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private readonly translateService = inject(TranslateService);
  
  customOptions: OwlOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 2000,
    autoplayHoverPause: true,
    smartSpeed: 1000,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    nav: false,
    navSpeed: 700,
    margin: 20,
    navText: [''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 3
      }
    }
  }

  ngOnInit(): void {
    this.updateCarouselOptions();
    this.translateService.onLangChange.subscribe(() => {
        this.updateCarouselOptions();
    });
  }

  updateCarouselOptions() {
    // Check if the current language is Arabic
    const isRtl = this.translateService.currentLang === 'ar' || this.translateService.defaultLang === 'ar';
    
    // Create a new object to trigger change detection if needed, or just update the property
    this.customOptions = {
        ...this.customOptions,
        rtl: isRtl
    };
  }
}
