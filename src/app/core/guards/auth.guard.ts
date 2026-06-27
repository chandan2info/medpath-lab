import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserSessionService } from '../services/user-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(UserSessionService);
  const router  = inject(Router);

  if (session.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/lis-home']);
};
