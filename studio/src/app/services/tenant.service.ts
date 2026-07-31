import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MetaTenant } from '../models/api.models';

const TENANT_STORAGE_KEY = 'platform_active_tenant';

/**
 * Holds the active tenant for the Studio session.
 * Phase 3: replace storage logic with JWT claim extraction.
 */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private _tenant$ = new BehaviorSubject<MetaTenant | null>(this.loadFromStorage());

  readonly tenant$ = this._tenant$.asObservable();

  get tenant(): MetaTenant | null {
    return this._tenant$.value;
  }

  get tenantId(): string {
    return this._tenant$.value?.tenantId ?? '';
  }

  setTenant(tenant: MetaTenant): void {
    this._tenant$.next(tenant);
    try {
      sessionStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    } catch { /* ignore storage errors */ }
  }

  clearTenant(): void {
    this._tenant$.next(null);
    sessionStorage.removeItem(TENANT_STORAGE_KEY);
  }

  private loadFromStorage(): MetaTenant | null {
    try {
      const raw = sessionStorage.getItem(TENANT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
