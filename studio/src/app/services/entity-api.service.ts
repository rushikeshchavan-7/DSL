import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';
import { MetaEntity, MetaField } from '../models/api.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EntityApiService {
  private readonly http = inject(HttpClient);
  private readonly tenantSvc = inject(TenantService);
  private readonly base = `${environment.apiUrl}/api/entities`;

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Tenant-Id': this.tenantSvc.tenantId });
  }

  // ── Entities ───────────────────────────────────────────────────────────────

  listEntities(): Observable<MetaEntity[]> {
    return this.http.get<MetaEntity[]>(this.base, { headers: this.headers() });
  }

  getEntity(id: string): Observable<MetaEntity> {
    return this.http.get<MetaEntity>(`${this.base}/${id}`, { headers: this.headers() });
  }

  createEntity(payload: { name: string; description?: string; pluralName?: string }): Observable<MetaEntity> {
    return this.http.post<MetaEntity>(this.base, payload, { headers: this.headers() });
  }

  updateEntity(id: string, payload: { name: string; description?: string; pluralName?: string }): Observable<MetaEntity> {
    return this.http.put<MetaEntity>(`${this.base}/${id}`, payload, { headers: this.headers() });
  }

  deleteEntity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.headers() });
  }

  // ── Fields ─────────────────────────────────────────────────────────────────

  listFields(entityId: string): Observable<MetaField[]> {
    return this.http.get<MetaField[]>(`${this.base}/${entityId}/fields`, { headers: this.headers() });
  }

  createField(entityId: string, payload: Partial<MetaField>): Observable<MetaField> {
    return this.http.post<MetaField>(`${this.base}/${entityId}/fields`, payload, { headers: this.headers() });
  }

  updateField(entityId: string, fieldId: string, payload: Partial<MetaField>): Observable<MetaField> {
    return this.http.put<MetaField>(`${this.base}/${entityId}/fields/${fieldId}`, payload, { headers: this.headers() });
  }

  deleteField(entityId: string, fieldId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${entityId}/fields/${fieldId}`, { headers: this.headers() });
  }
}
