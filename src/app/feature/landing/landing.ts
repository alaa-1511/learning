import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from "../../core/layout/auth/auth";
import { Courses } from "../courses/courses";
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Contact } from "../contact/contact";


export interface Review {
  nameAr: string;
  nameEn: string;
  textAr: string;
  textEn: string;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, Courses, CarouselModule, TranslateModule, Contact],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private readonly translateService = inject(TranslateService);

  reviews: Review[] = [
    {
      nameAr: 'عبدالرحمن عبدالله',
      nameEn: 'Abdulrahman Abdullah',
      textAr: 'السلام عليكم كيف الحال استاذ مؤمن ابشرك حصلت على الزماله الحمد لله رب العالمين بعد اجتياز اخر مادة لي المالية اشكرك جزيل الشكر يا دكتور',
      textEn: 'Peace be upon you, how are you Mr. Moamen? I have good news, I obtained the fellowship, praise be to God, Lord of the Worlds, after passing my last subject, Finance. I thank you very much, Doctor.'
    },
    {
      nameAr: 'سارة القحطاني',
      nameEn: 'Sara Alkahtani',
      textAr: 'السلام علیکم، ابشرك تم اجتياز المالية',
      textEn: 'Peace be upon you. Good news, I passed Finance.'
    },
    {
      nameAr: 'ساره سالم',
      nameEn: 'Sara Salem',
      textAr: 'السلام عليكم ورحمة الله وبركاته اخبارك دكتور مؤمن ابشرك اجتزت مادة المحاسبة المالية الشكر الله عز وجل ثم لك دكتور مؤمن. شهادة مني في اني استفدت من الدوره والحقيبه لان في تشابه كثير بين الاسئلة في حقيبتك واسئلة الاختبار جاتني شبه محاكاة. شكرا لك دكتور مؤمن🌹',
      textEn: 'Peace be upon you and God\'s mercy and blessings. How are you, Dr. Moamen? Good news, I passed the Financial Accounting subject. Thanks to God Almighty, then to you, Dr. Moamen. I testify that I benefited from the course and the bag because there is a lot of similarity between the questions in your bag and the exam questions, it was almost a simulation. Thank you, Dr. Moamen 🌹'
    },
    {
      nameAr: 'أيمان عبدالله',
      nameEn: 'Eman Abdullah',
      textAr: 'الحمد لله حصلت على درجة ٦٠ في المحاسبة المالية وأشكرك استاذ مؤمن جزيل الشكر على ما تقدمه جزاك الله خيرا. بالتوفيق',
      textEn: 'Praise be to God, I got a score of 60 in Financial Accounting, and I thank you, Mr. Moamen, very much for what you offer. May God reward you with good. Good luck.'
    },
    {
      nameAr: 'أحلام العتيبي',
      nameEn: 'Ahlam Alotibi',
      textAr: 'استاذ مؤمن اجتزت المالية من المحاولة الاولي اللهم لك الحمد شكرا لك استاذ ما قصرت والله',
      textEn: 'Mr. Moamen, I passed Finance from the first attempt. Praise be to God. Thank you, sir, you did not fall short, really.'
    },
    {
      nameAr: 'مرام محمد',
      nameEn: 'Maram Mohamad',
      textAr: 'ابشرك دكتور اجتزت CIA Part 1 ومن اول محاولة. شكرا لك دكتور مؤمن',
      textEn: 'Good news, Doctor, I passed CIA Part 1 from the first attempt. Thank you, Dr. Moamen.'
    },
    {
      nameAr: 'حنان منصور',
      nameEn: 'Hanan Mansour',
      textAr: 'السلام عليكم. استاذ مومن اطلعت على فيديو شرح اسئلة بارت ون اللي ارسلتها.. تبارك الله عليك. شرح ممتاز جدا كثير مروا علي دكاتره بس شرحك مختلف .. متحمسه للدورة باذن الله .',
      textEn: 'Peace be upon you. Mr. Moamen, I watched the video explaining Part One questions that you sent... You are amazing. The explanation is very excellent. I have seen many doctors, but your explanation is different... I am excited for the course, God willing.'
    },
    {
      nameAr: 'سعود الشهري',
      nameEn: 'Saud Alshehri',
      textAr: 'السلام عليكم ابشرك اجتزت CIA Part 2. شكرا لك يا استاذ مؤمن',
      textEn: 'Peace be upon you. Good news, I passed CIA Part 2. Thank you, Mr. Moamen.'
    },
    {
      nameAr: 'عبد المحسن الملحم',
      nameEn: 'Abdulmohsen Almolhem',
      textAr: 'سلام عليكم دكتور مؤمن زكريا الحمد الله حصلت علي زمالة المحاسبين الامريكية CMA بفضل الله عز وجل ثم فضلك في اجتيازي وحصولي علي البارتين شكرا الله يعطيك العافية',
      textEn: 'Peace be upon you, Dr. Moamen Zakaria. Praise be to God, I obtained the American CMA fellowship, thanks to God Almighty, then your favor in my passing and obtaining the two parts. Thank you, may God give you wellness.'
    },
    {
      nameAr: 'رنا القحطاني',
      nameEn: 'Rana Alkahtani',
      textAr: 'الحمد لله اجتزت CMA Part One وأشكرك استاذ مؤمن جزيل الشكر',
      textEn: 'Praise be to God, I passed CMA Part One, and I thank you, Mr. Moamen, very much.'
    },
    {
      nameAr: 'خلود العتيبي',
      nameEn: 'Kholud Alotibi',
      textAr: 'السلام عليكم استاذ مؤمن اليوم فهمت المحاظرة شرح سلس وبسيط شكرا لك استاذ الله يسعدك ما قصرت',
      textEn: 'Peace be upon you, Mr. Moamen. Today I understood the lecture, a smooth and simple explanation. Thank you, sir, may God make you happy, you did not fall short.'
    },
    {
      nameAr: 'ناصر حسن',
      nameEn: 'Nasser Hassan',
      textAr: 'الحمد الله نجحت في بارت وان CMA والله يا استاذ مؤمن انك ملم بافكار واسئلة الاختبار',
      textEn: 'Praise be to God, I succeeded in CMA Part One. I swear, Mr. Moamen, you are familiar with the ideas and questions of the exam.'
    },
    {
      nameAr: 'انوار',
      nameEn: 'Anwar',
      textAr: 'دكتور حصلت علي زمالة المحاسبية الامريكية واصحبت CMA Holder اللهم لك الحمد شكرا لك دكتور مؤمن الله يسعدك يارب',
      textEn: 'Doctor, I obtained the American fellowship and became a CMA Holder. Praise be to God. Thank you, Dr. Moamen, may God make you happy.'
    },
    {
      nameAr: 'امجاد الشمري',
      nameEn: 'Amjad Alshmri',
      textAr: 'اجتزت بارت تو صراحة يا استاذ بطل والله ما قصرت',
      textEn: 'I passed Part Two. Honestly, sir, you are a hero, you really did not fall short.'
    },
    {
      nameAr: 'عبد الرحمن عبدالله',
      nameEn: 'Abdulrahman Abdullah',
      textAr: 'يا دكتور مؤمن انا حصلت علي الزمالة تم الاتصال بي اليوم وحصولي علي الزمالة SOCPA شكرا لك يا دكتور الله يعطيك الف عافية',
      textEn: 'Dr. Moamen, I obtained the fellowship. I was contacted today and obtained the SOCPA fellowship. Thank you, Doctor, may God give you a thousand wellness.'
    },
    {
      nameAr: 'العنود فهد',
      nameEn: 'Alanoud Fahd',
      textAr: 'استاذ مؤمن اجتزت معك المالية والادارية واليوم حصلت علي الزمالة الحمد الله اللهم لك الحمد اتصلو عليه اليوم',
      textEn: 'Mr. Moamen, I passed Financial and Administrative with you, and today I obtained the fellowship, praise be to God. They called me today.'
    },
    {
      nameAr: 'عبير نايف',
      nameEn: 'Abeer Naif',
      textAr: 'مرا استفدت من دورتك وان شاء الله اختبر واجتاز المالية اعمل دا فى ريفيو',
      textEn: 'I benefited a lot from your course, and God willing, I will take the exam and pass Finance. I will do this in a review.'
    }
  ];
  
  customOptions: OwlOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    smartSpeed: 1000,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    nav: false,
    navSpeed: 700,
    margin: 20,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 1
      },
      740: {
        items: 2
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

  get isAr(): boolean {
    return this.translateService.currentLang === 'ar' || this.translateService.defaultLang === 'ar';
  }
}
