import { Routes } from '@angular/router';
import { Auth } from './core/layout/auth/auth';
import { Login } from './core/auth/login/login';
import { Register } from './core/auth/register/register';
// import { mainGuard } from './core/guards/main-guard';
import { Main } from './core/layout/main/main';

import { mainguardGuard } from './core/guards/mainguard-guard';
import { authguardGuard } from './core/guards/authguard-guard';
import { subscriptionGuard } from './core/guards/subscription-guard';
import { adminGuard } from './core/guards/admin-guard';





export const routes: Routes = [
  {path: '', redirectTo: 'landing', pathMatch: 'full' },
  {path: '', component: Main,
    children: [
      {path:'landing', loadComponent: () => import('./feature/landing/landing').then(m => m.Landing)},
      {path:'courses', loadComponent: () => import('./feature/courses/courses').then(m => m.Courses)},
      {path:'course-details/:type/:id', loadComponent: () => import('./feature/course-details/course-details').then(m => m.CourseDetails)},
      {path:'questions', loadComponent: () => import('./feature/questions/questions').then(m => m.Questions), canActivate: [subscriptionGuard]},
      {path:'articles', loadComponent: () => import('./feature/articles/articles').then(m => m.Articles)},
      {path:'article/:id', loadComponent: () => import('./feature/article-details/article-details').then(m => m.ArticleDetails) },
      {path:'who-are', loadComponent: () => import('./feature/who-are/who-are').then(m => m.WhoAre)},
      {path:'scopa', loadComponent: () => import('./feature/scopa/scopa').then(m => m.Scopa)},
      {path:'free-trail', loadComponent: () => import('./feature/free-trail/free-trail').then(m => m.FreeTrail)},
      {path:'contact', loadComponent: () => import('./feature/contact/contact').then(m => m.Contact)},
      {path:'cat', loadComponent: () => import('./feature/contact/cat/cat').then(m => m.CAT)},
      {path:'cert-ifr', loadComponent: () => import('./feature/contact/cert-ifr/cert-ifr').then(m => m.CertIFR)},
      {path:'cert-ia', loadComponent: () => import('./feature/contact/cert-ia/cert-ia').then(m => m.CertIA)},
      {path:'cfa', loadComponent: () => import('./feature/contact/cfa/cfa').then(m => m.CFA)},
      {path:'cia', loadComponent: () => import('./feature/contact/cia/cia').then(m => m.CIA)},
      {path:'cma', loadComponent: () => import('./feature/contact/cma/cma').then(m => m.CMA)},
      {path:'cme', loadComponent: () => import('./feature/contact/cme/cme').then(m => m.CME)},
      {path:'cpa', loadComponent: () => import('./feature/contact/cpa/cpa').then(m => m.CPA)},
      {path:'dipifrs', loadComponent: () => import('./feature/contact/dipifrs/dipifrs').then(m => m.DIPIFRS)},
      {path:'socpa', loadComponent: () => import('./feature/contact/socpa/socpa').then(m => m.SOCPACE)},
      {path:'step', loadComponent: () => import('./feature/contact/step/step').then(m => m.STEP)},
      {
        path: 'fmva',
        loadComponent: () => import('./feature/contact/fmva/fmva').then(m => m.FMVA)
      },
      {
        path: 'cia-challenge',
        loadComponent: () => import('./feature/contact/cia-challenge/cia-challenge').then(m => m.CiaChallenge)
      },
      {
        path: 'ea',
        loadComponent: () => import('./feature/contact/ea/ea').then(m => m.EA)
      },
      {
        path: 'fmaa',
        loadComponent: () => import('./feature/contact/fmaa/fmaa').then(m => m.FMAA)
      },
      {
        path: 'frm',
        loadComponent: () => import('./feature/contact/frm/frm').then(m => m.FRM)
      },
      {
        path: 'prm',
        loadComponent: () => import('./feature/contact/prm/prm').then(m => m.PRM)
      },
      {
        path: 'cfte',
        loadComponent: () => import('./feature/contact/cfte/cfte').then(m => m.CFTE)
      },
      {
        path: 'ipsas',
        loadComponent: () => import('./feature/contact/ipsas/ipsas').then(m => m.IPSAS)
      },
      {
        path: 'vat',
        loadComponent: () => import('./feature/contact/vat/vat').then(m => m.VAT)
      },
      {
        path: 'ffe',
        loadComponent: () => import('./feature/contact/ffe/ffe').then(m => m.FFE)
      },
      {
        path: 'pmp',
        loadComponent: () => import('./feature/contact/pmp/pmp').then(m => m.PMP)
      },
      {
        path: 'cfe',
        loadComponent: () => import('./feature/contact/cfe/cfe').then(m => m.CFE)
      },
      {
        path: 'cisa',
        loadComponent: () => import('./feature/contact/cisa/cisa').then(m => m.CISA)
      },
      {
        path: 'ifrs',
        loadComponent: () => import('./feature/contact/ifrs/ifrs').then(m => m.IFRS)
      },
      {
        path: 'pfa',
        loadComponent: () => import('./feature/contact/pfa/pfa').then(m => m.PFA)
      },
      {
        path: 'iap',
        loadComponent: () => import('./feature/contact/iap/iap').then(m => m.IAP)
      },
    
    ]

  },

    {
        path: '',
        component: Auth, canActivate: [mainguardGuard],
        children: [
            {
                path: 'login',
                component: Login,
            },
            {
                path: 'register',
                component: Register,
            },
        ]
    },
    {
        path: 'certifications',
        loadComponent: () => import('./feature/certifications/certifications').then(m => m.CertificationsComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./core/auth/login/login').then(m => m.Login)
    },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./feature/dashboard/dashboard').then(m => m.Dashboard),
        children: [
            {
                path: 'questions',
                loadComponent: () => import('./feature/dashboard/questions/questions').then(m => m.QuestionsManagement)
            },
            {
                path: 'courses',
                loadComponent: () => import('./feature/dashboard/courses/courses').then(m => m.CoursesManagement)
            },
            {
                path: 'certification',
                loadComponent: () => import('./feature/dashboard/certification/certification').then(m => m.Certification)
            },
            {
                path: 'articles',
                loadComponent: () => import('./feature/dashboard/articles/articles').then(m => m.Articles)
            },
            {
                path: 'assign-content',
                loadComponent: () => import('./feature/dashboard/assign-content/assign-content').then(m => m.AssignContentComponent)
            },
            { path: '', redirectTo: 'questions', pathMatch: 'full' }
        ]
      }

];
