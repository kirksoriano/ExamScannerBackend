import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TesterPage } from './tester.page';

describe('TesterPage', () => {
  let component: TesterPage;
  let fixture: ComponentFixture<TesterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TesterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
