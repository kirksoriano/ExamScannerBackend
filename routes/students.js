const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Import MySQL connection

// 📌 GET all students
router.get('/', (req, res) => {
  db.query('SELECT * FROM students', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 📌 GET a specific student by ID
router.get('/:id', (req, res) => {
  const studentId = req.params.id;
  db.query('SELECT * FROM students WHERE id = ?', [studentId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(result[0]);
  });
});

// 📌 POST - Add a new student
router.post('/', (req, res) => {
  const { name, grade_level, class_id } = req.body;
  db.query(
    'INSERT INTO students (name, grade_level, class_id) VALUES (?, ?, ?)',
    [name, grade_level, class_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Student added successfully', id: result.insertId });
    }
  );
});

// 📌 PUT - Update a student
router.put('/:id', (req, res) => {
  const studentId = req.params.id;
  const { name, grade_level, class_id } = req.body;
  db.query(
    'UPDATE students SET name = ?, grade_level = ?, class_id = ? WHERE id = ?',
    [name, grade_level, class_id, studentId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Student updated successfully' });
    }
  );
});

// 📌 DELETE - Remove a student
router.delete('/:id', (req, res) => {
  const studentId = req.params.id;
  db.query('DELETE FROM students WHERE id = ?', [studentId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Student deleted successfully' });
  });
});

module.exports = router;
