import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingSiteComponent } from './loading-site.component';

describe('LoadingComponent', () => {
  let component: LoadingSiteComponent;
  let fixture: ComponentFixture<LoadingSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
