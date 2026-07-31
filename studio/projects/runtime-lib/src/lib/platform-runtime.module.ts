import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DynamicFormComponent } from './dynamic-form.component';
import { PlatformClientService } from './platform-client.service';
import { PLATFORM_CONFIG, PlatformConfig } from './platform.config';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, DynamicFormComponent],
  exports: [DynamicFormComponent]
})
export class PlatformRuntimeModule {
  /**
   * Call in the host app's root module or AppConfig providers:
   *   PlatformRuntimeModule.forRoot({ apiUrl: 'http://...', tenantId: '...' })
   */
  static forRoot(config: PlatformConfig): ModuleWithProviders<PlatformRuntimeModule> {
    return {
      ngModule: PlatformRuntimeModule,
      providers: [
        { provide: PLATFORM_CONFIG, useValue: config },
        PlatformClientService
      ]
    };
  }
}
