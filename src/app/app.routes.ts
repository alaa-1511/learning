import { Routes } from '@angular/router';
import { Auth } from './core/layout/auth/auth';
import { Login } from './core/auth/login/login';
import { Register } from './core/auth/register/register';
// import { mainGuard } from './core/guards/main-guard';
import { Main } from './core/layout/main/main';
import { Landing } from './feature/landing/landing';

import { Courses } from './feature/courses/courses';
import { Dateliscourses } from './feature/courses/dateliscourses/dateliscourses';
import { Questions } from './feature/questions/questions';
import { mainguardGuard } from './core/guards/mainguard-guard';
import { authguardGuard } from './core/guards/authguard-guard';
import { subscriptionGuard } from './core/guards/subscription-guard';
import { adminGuard } from './core/guards/admin-guard';
import { Dashboard } from './feature/dashboard/dashboard';
import { Articles } from './feature/articles/articles';
import { WhoAre } from './feature/who-are/who-are';
import { Scopa } from './feature/scopa/scopa';
import { FreeTrail } from './feature/free-trail/free-trail';




export const routes: Routes = [
  {path: '', redirectTo: 'landing', pathMatch: 'full' },
  {path: '', component: Main,
    children: [
      {path:'landing', component: Landing},
      {path:'courses', component: Courses},
      {path:'dateliscourses', component: Dateliscourses},
      {path:'questions', component: Questions, canActivate: [subscriptionGuard]},
      {path:'articles', component: Articles},
      {path:'article/:id', loadComponent: () => import('./feature/article-details/article-details').then(m => m.ArticleDetails) },
      {path:'who-are', component: WhoAre},
      {path:'scopa', component: Scopa},
      {path:'free-trail', component: FreeTrail},
    
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
            { path: '', redirectTo: 'questions', pathMatch: 'full' }
        ]
      }

];
