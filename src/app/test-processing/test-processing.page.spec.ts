import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testprocessingPage } from './test-processing.page';

describe('TestProcessingPage', () => {
  let component: testprocessingPage;
  let fixture: ComponentFixture<testprocessingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(testprocessingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
