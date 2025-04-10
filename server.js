require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5001;

// MySQL pool setup
const db = mysql.createPool(process.env.DATABASE_URL);

// Check DB Connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Connected to Railway MySQL Database");
    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
})();

// CORS + JSON Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 🔐 JWT Middleware for protected routes
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ✅ Register
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: "Missing required fields." });

  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(409).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [email, hashedPassword, name]);

    res.status(201).json({
      message: "User registered successfully.",
      user: { id: result.insertId, email, name }
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Token verification route
app.post('/verify-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token valid', user: req.user });
});

// ==================== CLASS ROUTES ====================

// ✅ Get classes for a teacher
app.get('/classes/:teacher_id', authenticateToken, async (req, res) => {
  const { teacher_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM classes WHERE teacher_id = ?', [teacher_id]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching classes:", err.message);
    res.status(500).json({ error: 'Error fetching classes' });
  }
});

// ✅ Add class
app.post('/classes', authenticateToken, async (req, res) => {
  const { name, teacher_id } = req.body;
  if (!name || !teacher_id) return res.status(400).json({ error: 'Class name and teacher ID required.' });

  try {
    const [result] = await db.query('INSERT INTO classes (name, teacher_id) VALUES (?, ?)', [name, teacher_id]);
    res.json({ id: result.insertId, name, teacher_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create class.' });
  }
});

// ✅ Update class
app.put("/classes/:id", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const id = parseInt(req.params.id);
  if (!id || !name) return res.status(400).json({ error: "Missing class ID or name." });

  try {
    const [result] = await db.query("UPDATE classes SET name = ? WHERE id = ?", [name, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Class not found." });
    res.json({ message: "Class updated successfully." });
  } catch (err) {
    console.error("❌ Error updating class:", err.message);
    res.status(500).json({ error: "Database error while updating class." });
  }
});

// ✅ Delete class
app.delete("/classes/:classId", authenticateToken, async (req, res) => {
  const classId = req.params.classId;
  try {
    await db.query("DELETE FROM students WHERE class_id = ?", [classId]);
    const [result] = await db.query("DELETE FROM classes WHERE id = ?", [classId]);

    if (result.affectedRows > 0) {
      res.json({ message: "Class deleted successfully." });
    } else {
      res.status(404).json({ error: "Class not found." });
    }
  } catch (err) {
    console.error("❌ Error deleting class:", err.message);
    res.status(500).json({ error: "Database error while deleting class." });
  }
});

// ==================== STUDENT ROUTES ====================

// ✅ Get students in a class
app.get("/classes/:classId/students", authenticateToken, async (req, res) => {
  const { classId } = req.params;
  try {
    const [students] = await db.query("SELECT * FROM students WHERE class_id = ?", [classId]);
    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err.message);
    res.status(500).json({ error: "Database error while fetching students." });
  }
});

// ✅ Add student
app.post("/students", authenticateToken, async (req, res) => {
  const { name, grade_level, class_id } = req.body;
  if (!name || !grade_level || !class_id) return res.status(400).json({ error: "Missing student data." });

  try {
    const [result] = await db.query("INSERT INTO students (name, grade_level, class_id) VALUES (?, ?, ?)", [name, grade_level, class_id]);
    res.status(201).json({
      message: "Student added successfully.",
      student: { id: result.insertId, name, grade_level, class_id }
    });
  } catch (err) {
    console.error("❌ Error adding student:", err.message);
    res.status(500).json({ error: "Database error while adding student." });
  }
});

// ✅ Update student
app.put("/students/:id", authenticateToken, async (req, res) => {
  const { name, grade_level, class_id } = req.body;
  const id = parseInt(req.params.id);
  if (!id || !name || !grade_level || !class_id) return res.status(400).json({ error: "Missing student data." });

  try {
    const [result] = await db.query("UPDATE students SET name = ?, grade_level = ?, class_id = ? WHERE id = ?", [name, grade_level, class_id, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student updated successfully." });
  } catch (err) {
    console.error("❌ Error updating student:", err.message);
    res.status(500).json({ error: "Database error while updating student." });
  }
});

// ✅ Delete student
app.delete("/students/:studentId", authenticateToken, async (req, res) => {
  const studentId = req.params.studentId;
  try {
    const [result] = await db.query("DELETE FROM students WHERE id = ?", [studentId]);
    if (result.affectedRows > 0) {
      res.json({ message: "Student deleted successfully." });
    } else {
      res.status(404).json({ error: "Student not found." });
    }
  } catch (err) {
    console.error("❌ Error deleting student:", err.message);
    res.status(500).json({ error: "Database error while deleting student." });
  }
});

// ==================== ANSWER SHEETS ====================

// ✅ Save answer sheet
app.post('/answer-sheets', authenticateToken, async (req, res) => {
  const { teacher_id, answerSheet } = req.body;
  if (!teacher_id || !answerSheet) return res.status(400).json({ error: 'Missing teacher_id or answerSheet.' });

  try {
    const [result] = await db.query('INSERT INTO answer_sheets (teacher_id, answers) VALUES (?, ?)', [teacher_id, JSON.stringify(answerSheet)]);
    res.status(200).json({ message: 'Answer sheet saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving answer sheet:', err.message);
    res.status(500).json({ error: 'Error saving answer sheet' });
  }
});

// ✅ Get answer sheets by teacher
app.get('/answer-sheets', authenticateToken, async (req, res) => {
  const teacherId = req.query.teacherId;
  if (!teacherId) return res.status(400).json({ error: 'Missing teacherId' });

  try {
    const [rows] = await db.query('SELECT * FROM answer_sheets WHERE teacher_id = ?', [teacherId]);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching answer sheets:', err.message);
    res.status(500).json({ message: 'Error fetching answer sheets' });
  }
});

// ✅ Server Start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
