import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuntimeLib } from './runtime-lib';

describe('RuntimeLib', () => {
  let component: RuntimeLib;
  let fixture: ComponentFixture<RuntimeLib>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuntimeLib]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuntimeLib);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
