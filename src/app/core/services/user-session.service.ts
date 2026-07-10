import { Injectable, signal } from '@angular/core';

export interface Operator {
  name: string;
  initials: string;
  role: string;
  labName: string;
}

/**
 * Demo-app session persistence only. There is no real backend/token here,
 * so a plain localStorage blob is an acceptable stand-in for now — but this
 * is NOT how session persistence should work once real authentication
 * (JWT/session cookie, as already used in the Publixo project) is wired up.
 * Treat this as scaffolding to be replaced, not a pattern to copy forward.
 */
const SESSION_KEY = 'medpath.lis.session';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly _operator = signal<Operator | null>(null);
  private readonly _loggedIn = signal(false);

  readonly operator = this._operator.asReadonly();
  readonly isLoggedIn = this._loggedIn.asReadonly();

  constructor() {
    // Restore a "remembered" session on app start (e.g. after a page refresh).
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        this._operator.set(JSON.parse(saved) as Operator);
        this._loggedIn.set(true);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }

  /** Called after login */
  setOperator(op: Operator): void {
    this._operator.set(op);
    this._loggedIn.set(true);
  }

  /**
   * Real auth: checks username AND password (demo credentials: ravi.anand / MedPath@2024).
   * @param remember When true, the session survives a page refresh (see SESSION_KEY above).
   */
  login(username: string, password: string, remember = false): boolean {
    const validUsername = 'ravi.anand';
    const validPassword = 'MedPath@2024';
    if (username.trim() === validUsername && password === validPassword) {
      const operator: Operator = {
        name:     'Ravi Anand',
        initials: 'RA',
        role:     'Lab Operator',
        labName:  'MedPath Diagnostics',
      };
      this._operator.set(operator);
      this._loggedIn.set(true);
      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(operator));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
      return true;
    }
    return false;
  }

  logout(): void {
    this._operator.set(null);
    this._loggedIn.set(false);
    localStorage.removeItem(SESSION_KEY);
  }
}
