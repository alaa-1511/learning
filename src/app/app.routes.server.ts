import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  } ,
  
  {
   path: 'article/:id',
    renderMode: RenderMode.Server

  },
  {
   path: 'course-details/:type/:id',
    renderMode: RenderMode.Server

  },
];
