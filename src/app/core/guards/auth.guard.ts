import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserSessionService } from '../services/user-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(UserSessionService);
  const router  = inject(Router);

  // For demo: operator is always set; swap with real token check in production.
  if (session.operator().name) {
    return true;
  }
  return router.createUrlTree(['/lis-home']);
};
