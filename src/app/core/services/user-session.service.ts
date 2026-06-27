import { Injectable, signal } from '@angular/core';

export interface Operator {
  name: string;
  initials: string;
  role: string;
  labName: string;
}

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly _operator = signal<Operator | null>(null);
  private readonly _loggedIn = signal(false);

  readonly operator = this._operator.asReadonly();
  readonly isLoggedIn = this._loggedIn.asReadonly();

  /** Called after login */
  setOperator(op: Operator): void {
    this._operator.set(op);
    this._loggedIn.set(true);
  }

  /** Real auth: checks username AND password (demo credentials: ravi.anand / MedPath@2024) */
  login(username: string, password: string): boolean {
    const validUsername = 'ravi.anand';
    const validPassword = 'MedPath@2024';
    if (username.trim() === validUsername && password === validPassword) {
      this._operator.set({
        name:     'Ravi Anand',
        initials: 'RA',
        role:     'Lab Operator',
        labName:  'MedPath Diagnostics',
      });
      this._loggedIn.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    this._operator.set(null);
    this._loggedIn.set(false);
  }
}
