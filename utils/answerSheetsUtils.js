// utils/answerSheetsUtils.js

function generateAnswerSheetLayout(subject, numberOfQuestions, optionsPerQuestion) {
    const layout = {
      subject,
      totalQuestions: numberOfQuestions,
      optionsPerQuestion,
      questions: [],
    };
  
    for (let i = 1; i <= numberOfQuestions; i++) {
      const question = {
        number: i,
        options: [],
      };
  
      for (let j = 0; j < optionsPerQuestion; j++) {
        const optionLabel = String.fromCharCode(65 + j); // A, B, C, D
        question.options.push({
          label: optionLabel,
          isCorrect: false, // default
        });
      }
  
      layout.questions.push(question);
    }
  
    return layout;
  }
  
  function scoreAnswerSheet(studentAnswers, correctAnswers) {
    if (studentAnswers.length !== correctAnswers.length) {
      throw new Error('Number of answers does not match the answer key.');
    }
  
    let score = 0;
    const result = [];
  
    for (let i = 0; i < correctAnswers.length; i++) {
      const studentAnswer = studentAnswers[i];
      const correctAnswer = correctAnswers[i];
  
      const isCorrect = studentAnswer === correctAnswer;
  
      if (isCorrect) score++;
  
      result.push({
        question: i + 1,
        studentAnswer,
        correctAnswer,
        isCorrect,
      });
    }
  
    return {
      score,
      total: correctAnswers.length,
      breakdown: result,
    };
  }
  
  module.exports = {
    generateAnswerSheetLayout,
    scoreAnswerSheet,
  };
  