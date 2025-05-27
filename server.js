require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5001;
const answerSheetsUtils = require('./utils/answerSheetsUtils');

const { generateLayout } = require('./utils/layoutGenerator');
const { createAnswerSheetsPDF } = require('./routes/answerSheets'); // ✅ Do not change this

const answerSheetsRoutes = require('./routes/answerSheets');
app.use('/answerSheets', answerSheetsRoutes);

const HF_API_URL = 'https://api-inference.huggingface.co/models/valhalla/t5-base-qg-hl';
const HF_API_KEY = process.env.HF_API_KEY;

const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Environment checks
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing.");
  process.exit(1);
}
console.log("✅ DATABASE_URL:", process.env.DATABASE_URL);

// MySQL Pool
const db = mysql.createPool(process.env.DATABASE_URL);
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

// Hugging Face Question Generator
const generateQuestion = async (competencyText) => {
  try {
    const prompt = `Gumawa ng isang tanong na multiple choice batay sa sumusunod na paksa: "${competencyText}". Isama ang tanong, 4 na pagpipilian, at ang tamang sagot.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/bigscience/bloom-560m',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating question:', error.response?.data || error.message);
    return null;
  }
};

module.exports = generateQuestion;

// ✅ Register
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const [result] = await db.query(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, password, name]
    );

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: result.insertId,
        email,
        name
      }
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
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

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/headers";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `header-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Upload header
app.post("/upload-header", upload.single("header"), async (req, res) => {
  const { studentId, answerSheetsId } = req.body;
  try {
    await db.query(
      "INSERT INTO scanned_students (student_id, answer_sheet_id, header_image_path) VALUES (?, ?, ?)",
      [studentId, answerSheetsId, req.file.path]
    );
    res.json({ success: true, headerPath: req.file.path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save header crop" });
  }
});

// Answer sheet routes
app.post("/generate-answer-sheet", async (req, res) => {
  const { tosId, title, classId } = req.body;
  try {
    const [tosItems] = await db.query("SELECT * FROM tos_items WHERE tos_id = ?", [tosId]);
    const layout = generateLayout(tosItems);
    const [result] = await db.query(
      "INSERT INTO answer_sheets (title, tos_id, class_id, layout_json) VALUES (?, ?, ?, ?)",
      [title, tosId, classId, JSON.stringify(layout)]
    );
    res.json({ success: true, id: result.insertId, layout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate answer sheet" });
  }
});

app.get("/answer-sheet-printable/:tos_id", async (req, res) => {
  const { tos_id } = req.params;
  try {
    const pdfBuffer = await createAnswerSheetsPDF(tos_id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=answer_sheet_${tos_id}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate answer sheet PDF" });
  }
});

app.get("/answer-sheet-layout/:tos_id", async (req, res) => {
  const { tos_id } = req.params;
  try {
    const layout = await generateLayout(tos_id);
    res.json({ layout });
  } catch (err) {
    console.error("Error getting layout:", err);
    res.status(500).json({ error: "Failed to retrieve layout" });
  }
});

// Submit scanned answers
app.post("/submit-answers", async (req, res) => {
  const { studentId, answerSheetsId, detectedAnswers } = req.body;
  try {
    const [sheetRows] = await db.query("SELECT * FROM answer_sheets WHERE id = ?", [answerSheetsId]);
    if (!sheetRows.length) return res.status(404).json({ error: "Answer sheet not found" });

    const layout = JSON.parse(sheetRows[0].layout_json);
    const scoreReport = answerSheetsUtils.scoreAnswers(detectedAnswers, layout);

    await db.query(
      "INSERT INTO results (student_id, answer_sheet_id, score, topic_breakdown) VALUES (?, ?, ?, ?)",
      [studentId, answerSheetsId, scoreReport.totalScore, JSON.stringify(scoreReport.topicBreakdown)]
    );
    res.json({ success: true, report: scoreReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit answers" });
  }
});

// ✅ Fetch all classes for a specific teacher
app.get('/classes', async (req, res) => {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return res.status(400).json({ error: "teacher_id is required." });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM classes WHERE teacher_id = ?', [teacher_id]);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching classes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Add a new class
app.post('/classes', async (req, res) => {
    const { name, teacher_id } = req.body;
  
    if (!name || !teacher_id) {
      return res.status(400).json({ error: 'Class name and teacher ID are required.' });
    }
  
    try {
      const [result] = await db.execute(
        'INSERT INTO classes (name, teacher_id) VALUES (?, ?)',
        [name, teacher_id]
      );
      res.json({ id: result.insertId, name, teacher_id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create class.' });
    }
});

//edit class
app.put('/classes/:classId', async (req, res) => {
    const classId = req.params.classId;
    const { name, teacher_id } = req.body;

    try {
        const [result] = await db.execute(
            'UPDATE classes SET name = ?, teacher_id = ? WHERE id = ?',
            [name, teacher_id, classId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json({ message: 'Class updated successfully' });
    } catch (error) {
        console.error("❌ Error updating class:", error.message);
        res.status(500).json({ message: 'Error updating class' });
    }
});

// ✅ Delete class
app.delete('/classes/:classId', async (req, res) => {
    const classId = req.params.classId;

    try {
        const [result] = await db.execute('DELETE FROM classes WHERE id = ?', [classId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error("❌ Error deleting class:", error.message);
        res.status(500).json({ message: 'Error deleting class' });
    }
});

// ✅ Fetch students for a specific class (using route parameter)
app.get('/classes/:classId/students', async (req, res) => {
    const classId = req.params.classId;

    try {
        const [students] = await db.query("SELECT * FROM students WHERE class_id = ?", [classId]);
        res.json(students);
    } catch (error) {
        console.error("❌ Error fetching students:", error.message);
        res.status(500).json({ error: "Database error while fetching students." });
    }
});

// POST /students - Add a student to a class
app.post('/students', async (req, res) => {
    const { name, grade_level, class_id } = req.body;

    if (!name || !grade_level || !class_id) {
        return res.status(400).json({ error: 'Missing required fields: name, grade_level, or class_id.' });
    }

    try {
        const result = await db.query(
            "INSERT INTO students (name, grade_level, class_id) VALUES (?, ?, ?)",
            [name, grade_level, class_id]
        );

        res.status(201).json({ message: 'Student added successfully', studentId: result.insertId });
    } catch (error) {
        console.error("❌ Error adding student:", error.message);
        res.status(500).json({ error: "Database error while adding student." });
    }
});

// ✅ Edit student details
app.put('/students/:studentId', async (req, res) => {
    const studentId = req.params.studentId;
    const { name, class_id } = req.body;

    try {
        const [result] = await db.execute(
            'UPDATE students SET name = ?, class_id = ? WHERE id = ?',
            [name, class_id, studentId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error("❌ Error updating student:", error.message);
        res.status(500).json({ message: 'Error updating student' });
    }
});

// ✅ Delete student
app.delete('/students/:studentId', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const [result] = await db.execute('DELETE FROM students WHERE id = ?', [studentId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error("❌ Error deleting student:", error.message);
        res.status(500).json({ message: 'Error deleting student' });
    }
});
    
// Create new TOS (with table_data)
app.post('/tos', async (req, res) => {
  const { teacherId, tosTitle, subject, totalItems, table_data } = req.body;

  if (!teacherId || !tosTitle || !subject) {
    return res.status(400).json({ error: 'Missing required fields: teacherId, tosTitle, or subject' });
  }

  let tableDataJSON = null;
  try {
    tableDataJSON = table_data ? JSON.stringify(table_data) : JSON.stringify([]);
  } catch (jsonErr) {
    console.error('Invalid table_data format:', jsonErr);
    return res.status(400).json({ error: 'Invalid table_data format' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO tos (teacher_id, tos_title, subject, total_items, table_data) VALUES (?, ?, ?, ?, ?)`,
      [teacherId, tosTitle, subject, totalItems || 0, tableDataJSON]
    );
    res.status(201).json({ id: result.insertId, message: 'TOS created successfully' });
  } catch (err) {
    console.error('Error creating TOS:', err);
    res.status(500).json({ error: 'Server error while creating TOS' });
  }
});

// ✅ GET all answer sheets for a specific teacher
app.get('/answer-sheets', async (req, res) => {
  const { teacher_id } = req.query;

  if (!teacher_id) {
    return res.status(400).json({ message: 'Missing teacher_id' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM answer_sheets WHERE teacher_id = ?', [teacher_id]);

    // Optional: Normalize keys to match frontend expectations (camelCase)
    const formattedRows = rows.map(row => ({
      id: row.id,
      examTitle: row.exam_title,
      subject: row.subject,
      gradeLevel: row.grade_level,
      questions: JSON.parse(row.questions),
      teacherId: row.teacher_id
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('❌ Error fetching answer sheets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get one TOS by id (with its items)
app.get('/tos/:id', async (req, res) => {
  const tosId = req.params.id;
  try {
    const [tosRows] = await db.execute('SELECT * FROM tos WHERE id = ?', [tosId]);
    if (tosRows.length === 0) return res.status(404).json({ error: 'TOS not found' });

    const [items] = await db.execute('SELECT * FROM tos_items WHERE tos_id = ?', [tosId]);
    res.json({ tos: tosRows[0], items });
  } catch (err) {
    console.error('Error fetching TOS:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update TOS (including table_data)
app.put('/tos/:id', async (req, res) => {
  const tosId = req.params.id;
  const { tosTitle, subject, totalItems, table_data } = req.body;
  try {
    const [result] = await db.execute(
      'UPDATE tos SET tos_title = ?, subject = ?, total_items = ?, table_data = ? WHERE id = ?',
      [tosTitle, subject, totalItems, JSON.stringify(table_data), tosId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'TOS not found' });
    res.json({ message: 'TOS updated successfully' });
  } catch (err) {
    console.error('Error updating TOS:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete TOS and cascade delete items
app.delete('/tos/:id', async (req, res) => {
  const tosId = req.params.id;
  try {
    const [result] = await db.execute('DELETE FROM tos WHERE id = ?', [tosId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'TOS not found' });
    res.json({ message: 'TOS deleted successfully' });
  } catch (err) {
    console.error('Error deleting TOS:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add TOS Item
app.post('/tos/:tosId/items', async (req, res) => {
  const tosId = req.params.tosId;
  const {
    topic,
    items,
    learningCompetency,
    noOfDays,
    percentage,
    noOfItems,
    remembering,
    understanding,
    applying,
    analyzing,
    evaluating,
    creating,
    totalNoOfItems,
    questionsToGenerate
  } = req.body;

  if (!learningCompetency || totalNoOfItems === undefined) {
    return res.status(400).json({ error: 'Missing required fields: learningCompetency, totalNoOfItems' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO tos_items (
        tos_id,
        topic,
        items,
        learning_competency,
        no_of_days,
        percentage,
        no_of_items,
        remembering,
        understanding,
        applying,
        analyzing,
        evaluating,
        creating,
        total_no_of_items,
        questions_to_generate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tosId,
        topic,
        items,
        learningCompetency,
        noOfDays,
        percentage,
        noOfItems,
        remembering,
        understanding,
        applying,
        analyzing,
        evaluating,
        creating,
        totalNoOfItems,
        questionsToGenerate
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'TOS Item added' });
  } catch (err) {
    console.error('Error adding TOS Item:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update TOS Item
app.put('/tos/items/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  const {
    topic,
    items,
    learningCompetency,
    noOfDays,
    percentage,
    noOfItems,
    remembering,
    understanding,
    applying,
    analyzing,
    evaluating,
    creating,
    totalNoOfItems,
    questionsToGenerate
  } = req.body;

  try {
    const [result] = await db.execute(
      `UPDATE tos_items SET
        topic = ?,
        items = ?,
        learning_competency = ?,
        no_of_days = ?,
        percentage = ?,
        no_of_items = ?,
        remembering = ?,
        understanding = ?,
        applying = ?,
        analyzing = ?,
        evaluating = ?,
        creating = ?,
        total_no_of_items = ?,
        questions_to_generate = ?
      WHERE id = ?`,
      [
        topic,
        items,
        learningCompetency,
        noOfDays,
        percentage,
        noOfItems,
        remembering,
        understanding,
        applying,
        analyzing,
        evaluating,
        creating,
        totalNoOfItems,
        questionsToGenerate,
        itemId
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'TOS Item not found' });
    res.json({ message: 'TOS Item updated successfully' });
  } catch (err) {
    console.error('Error updating TOS Item:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete TOS Item
app.delete('/tos/items/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  try {
    const [result] = await db.execute('DELETE FROM tos_items WHERE id = ?', [itemId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'TOS Item not found' });
    res.json({ message: 'TOS Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting TOS Item:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/routes-check', (req, res) => {
    res.json({
      message: "Routes check",
      routes: [
        "GET /classes/:classId/students",
        "POST /students"
      ]
    });
  });
  
  
// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
