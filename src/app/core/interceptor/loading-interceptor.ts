import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BusyService } from '../service/busy.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const busyService = inject(BusyService);
  
  busyService.busy();

  return next(req).pipe(
    finalize(() => {
      busyService.idle();
    })
  );
};
