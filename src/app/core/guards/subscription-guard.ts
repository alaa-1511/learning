import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authservice } from '../auth/auth/authservice';
import { SubscriptionService } from '../service/subscription.service';
import { SpecailEmail } from '../service/specailemail';
import { map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authservice);
  const router = inject(Router);
  const subService = inject(SubscriptionService);
  const specialEmail = inject(SpecailEmail);

  return authService.currentUser.pipe(
    take(1),
    switchMap(({ data }) => {
      const user = data?.user;
      
     
      if (!user) {
         router.navigate(['/']); 
         subService.openModal();
         return of(false);
      }

      if (subService.isSubscribed(user)) {
        return of(true);
      }

      if (user.email) {
          return specialEmail.isSpecialEmail(user.email).pipe(
              map(isSpecial => {
                  if (isSpecial) return true;
                  
                  
                  router.navigate(['/']); 
                  subService.openModal();
                  return false;
              })
          );
      }

      // Default block
      router.navigate(['/']);
      subService.openModal();
      return of(false);
    })
  );
};
