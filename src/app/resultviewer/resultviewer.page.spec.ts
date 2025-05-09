import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultviewerPage } from './resultviewer.page';

describe('ResultviewerPage', () => {
  let component: ResultviewerPage;
  let fixture: ComponentFixture<ResultviewerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultviewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
