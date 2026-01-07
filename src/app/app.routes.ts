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
import { adminGuard } from './core/guards/admin-guard';
import { Dashboard } from './feature/dashboard/dashboard';
import { Articles } from './feature/articles/articles';
import { WhoAre } from './feature/who-are/who-are';




export const routes: Routes = [
  {path: '', redirectTo: 'landing', pathMatch: 'full' },
  {path: '', component: Main,
    children: [
      {path:'landing', component: Landing},
      {path:'courses', component: Courses},
      {path:'dateliscourses', component: Dateliscourses},
      {path:'questions', component: Questions},
      {path:'articles', component: Articles},
      {path:'who-are', component: WhoAre},
    
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
            { path: '', redirectTo: 'questions', pathMatch: 'full' }
        ]
      }

];
