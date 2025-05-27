const express = require('express');
const router = express.Router();

const {
  generateAnswerSheetLayout,
  scoreAnswerSheet
} = require('../utils/answerSheetsUtils');

// Route to generate a bubble layout template
router.post('/generate-layout', (req, res) => {
  const { subject, numberOfQuestions, optionsPerQuestion } = req.body;

  if (!subject || !numberOfQuestions || !optionsPerQuestion) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const layout = generateAnswerSheetLayout(subject, numberOfQuestions, optionsPerQuestion);
    res.json(layout);
  } catch (err) {
    console.error('Error generating layout:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to score a submitted answer sheet
router.post('/score', (req, res) => {
  const { studentAnswers, correctAnswers } = req.body;

  if (!studentAnswers || !correctAnswers) {
    return res.status(400).json({ message: 'Missing answers for scoring' });
  }

  try {
    const result = scoreAnswerSheet(studentAnswers, correctAnswers);
    res.json(result);
  } catch (err) {
    console.error('Error scoring answer sheet:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
