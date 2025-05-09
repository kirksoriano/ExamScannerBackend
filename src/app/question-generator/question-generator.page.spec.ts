import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionGeneratorPage } from './question-generator.page';

describe('QuestionGeneratorPage', () => {
  let component: QuestionGeneratorPage;
  let fixture: ComponentFixture<QuestionGeneratorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionGeneratorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
