import { InjectionToken } from '@angular/core';

export interface PlatformConfig {
  apiUrl: string;
  tenantId: string;
}

export const PLATFORM_CONFIG = new InjectionToken<PlatformConfig>('PLATFORM_CONFIG');
