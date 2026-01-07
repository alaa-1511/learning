import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SpecailEmail } from '../service/specailemail';
import { from, map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const specialEmailService = inject(SpecailEmail);
  const router = inject(Router);

 
  return from(specialEmailService.isAllowedUser()).pipe(
    map((isAllowed) => {
      if (isAllowed) {
        return true;
      } else {
        router.navigate(['/landing']);
        return false;
      }
    }),
    catchError(() => {
        router.navigate(['/landing']);
        return of(false);
    })
  );
};
