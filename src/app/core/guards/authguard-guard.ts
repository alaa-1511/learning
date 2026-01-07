import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authservice } from '../auth/auth/authservice';
import { map } from 'rxjs';



export const authguardGuard: CanActivateFn = (route, state) => {
 const authService = inject(Authservice);
  const router = inject(Router);

  return authService.currentUser.pipe(
    map(({ data }) => {
      if (data?.user) {
        return true; 
      }

      router.navigate(['/login']);
      return false;
    })
  );
};
