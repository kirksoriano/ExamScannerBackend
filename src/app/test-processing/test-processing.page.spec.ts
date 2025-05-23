import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestProcessingPage } from './test-processing.page';

describe('TestProcessingPage', () => {
  let component: TestProcessingPage;
  let fixture: ComponentFixture<TestProcessingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestProcessingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
