import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Convert the Promise from getJwt into an Observable and merge it
  return from(authService.getJwt()).pipe(
    switchMap(token => {
      // If we have a token, clone the request and add the Bearer header
      if (token) {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedRequest);
      }
      
      // If there's no token, just send the original request
      return next(req);
    })
  );
};
