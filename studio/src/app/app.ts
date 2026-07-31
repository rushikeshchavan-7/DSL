import { Component } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="accent">◈</span> Platform Studio
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/entities" routerLinkActive="active">
            🗂️ Entities
          </a>
        </nav>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: []
})
export class App {}
