import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Authservice } from '../auth/auth/authservice';

export const mainguardGuard: CanActivateFn = (route, state) => {
 const authService = inject(Authservice);
  const router = inject(Router);

  return authService.currentUser.pipe(
    map(({ data }) => {
      if (!data?.user) {
        return true; 
      }

      router.navigate(['/landing']);
      return false;
    })
  );
};
