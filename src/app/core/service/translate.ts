import { isPlatformBrowser } from '@angular/common';
import { inject, Inject, Injectable, PLATFORM_ID, RendererFactory2, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class Translate {
  //   private readonly renderer2 =inject(RendererFactory2).createRenderer(null, null);
  // constructor( private translateService: TranslateService ,@Inject(PLATFORM_ID) private platformId: Object ) { 

  //   if(isPlatformBrowser(this.platformId)){
  //     const savedLanguage = localStorage.getItem('language') || 'en';
  //     this.translateService.setDefaultLang('en');
  //     this.translateService.use(savedLanguage);
  //     this.changeDirection();
  //   }


  // }
  // changeDirection():void {
  //   if (isPlatformBrowser(this.platformId)) {
  //     const lang = localStorage.getItem('language') || 'en';
  //     if(lang === 'en'){
  //       this.renderer2.setAttribute(document.documentElement,'dir','ltr')
  //       this.renderer2.setAttribute(document.documentElement,'lang','en')
  
  //     }else if(lang === 'ar') {
  //       this.renderer2.setAttribute(document.documentElement,'dir','rtl')
  //       this.renderer2.setAttribute(document.documentElement,'lang','ar')
  //     }  
  //   }
  // }
  // changeLanguage(lang:string){
  //   //save language in storage
  //   if (isPlatformBrowser(this.platformId)) {
  //     localStorage.setItem('language',lang)
  //   }
  //   this.translateService.use(lang)
  //   this.changeDirection()
  // }
    private readonly renderer2 =inject(RendererFactory2).createRenderer(null, null);
    
   languageSignal = signal<string>('en');

  constructor( private translateService: TranslateService ,@Inject(PLATFORM_ID) private platformId: Object ) { 

    if(isPlatformBrowser(this.platformId)){
     
      //logic translateService
          //  1-set default language
            this.translateService.setDefaultLang('en');
          //  2- get language from localStorage
          const savedLanguage = localStorage.getItem('language');
          //  3- use language lacal
          if (savedLanguage) {
            this.translateService.use(savedLanguage !);
            this.languageSignal.set(savedLanguage);
          }
          this.changeDirection();
    }


  }
  changeDirection(lang?: string): void {
    const currentLang = lang || localStorage.getItem('language') || 'en';
    if (currentLang === 'en') {
      this.renderer2.setAttribute(document.documentElement, 'dir', 'ltr');
      this.renderer2.setAttribute(document.documentElement, 'lang', 'en');
    } else if (currentLang === 'ar') {
      this.renderer2.setAttribute(document.documentElement, 'dir', 'rtl');
      this.renderer2.setAttribute(document.documentElement, 'lang', 'ar');
    }
  }


  changeLanguage(lang:string){
    //save language in storage
    localStorage.setItem('language',lang)
    this.translateService.use(lang)
    this.changeDirection(lang)
    this.languageSignal.set(lang);
  }

  get currentLang(){
    return this.translateService.currentLang;
  }



}
