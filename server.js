require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

const HF_API_URL = 'https://api-inference.huggingface.co/models/valhalla/t5-base-qg-hl';
const HF_API_KEY = process.env.HF_API_KEY;

app.use(cors());
app.use(express.json()); // this enables JSON body parsing


// Ensure the JWT_SECRET is loaded properly
if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is missing.");
    process.exit(1);
}

// Log the URL for verification (to ensure environment variables are loaded correctly)
console.log("✅ DATABASE_URL:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing.");
    process.exit(1);
}

// Set up MySQL connection pool using Railway's MySQL database URL
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

// Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',  // Replace with your frontend URL if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

const generateQuestion = async (competencyText) => {
  try {
    const prompt = `Gumawa ng isang tanong na multiple choice batay sa sumusunod na paksa: "${competencyText}". Isama ang tanong, 4 na pagpipilian, at ang tamang sagot.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/bigscience/bloom-560m', // TEMP fallback model
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

// ✅ Register User
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

        // Store password as plain text for now
        const [result] = await db.query(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            [email, password, name]
        );
        
        return res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: result.insertId,
                email,
                name
            }
        });
    } catch (err) {
        console.error("❌ Registration error:", err);
        return res.status(500).json({ message: "Server error during registration." });
    }
});

// ✅ Login User
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        
        // Compare the password directly (no bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create a JWT token if the password matches
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token  // Send the token to the frontend
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ Fetch all classes for a specific teacher (using query parameter)
app.get('/classes', async (req, res) => {
    const teacherId = req.query.teacher_id;
    if (!teacherId) {
        return res.status(400).json({ error: "teacher_id is required." });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM classes WHERE teacher_id = ?', [teacherId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching classes:', error.message);
        res.status(500).json({ message: 'Error fetching classes' });
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


// Get all answer sheets for a teacher
app.get('/answer-sheets', async (req, res) => {
  const { teacher_id } = req.query;

  if (!teacher_id) {
    return res.status(400).json({ message: 'Missing teacher_id' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM answer_sheets WHERE teacher_id = ? ORDER BY id DESC',
      [teacher_id]
    );

    const parsedRows = rows.map(row => {
      try {
        return {
          ...row,
          questions: JSON.parse(row.questions)
        };
      } catch (err) {
        return {
          ...row,
          questions: []
        };
      }
    });

    res.json(parsedRows);
  } catch (err) {
    console.error('❌ Error fetching answer sheets:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
  
  // Save a new Answer Sheet
app.post('/answer-sheets', async (req, res) => {
    const { examTitle, subject, gradeLevel, questions, teacherId } = req.body;
  
    console.log('Received request body:', req.body);
  
    if (!teacherId || !examTitle || !subject || !gradeLevel || !questions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    try {
      const [result] = await db.execute(
        'INSERT INTO answer_sheets (exam_title, subject, grade_level, questions, teacher_id) VALUES (?, ?, ?, ?, ?)',
        [examTitle, subject, gradeLevel, JSON.stringify(questions), teacherId]
      );
  
      res.json({ id: result.insertId, message: 'Answer sheet saved' });
    } catch (err) {
      console.error('❌ Error saving answer sheet:', err);
      res.status(500).json({ message: 'Server error while saving answer sheet', error: err.message });
    }
  });
  
  
// Update an existing answer sheet (camelCase keys for consistency)
app.put('/answer-sheets/:id', async (req, res) => {
  const { id } = req.params;
  const { examTitle, subject, gradeLevel, questions } = req.body;

  if (!examTitle || !subject || !gradeLevel || !questions) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await db.query(
      'UPDATE answer_sheets SET exam_title = ?, subject = ?, grade_level = ?, questions = ? WHERE id = ?',
      [examTitle, subject, gradeLevel, JSON.stringify(questions), id]
    );
    res.status(200).json({ message: 'Answer sheet updated' });
  } catch (error) {
    console.error('❌ Error updating answer sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an answer sheet (fix destructuring of result)
app.delete('/answer-sheets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM answer_sheets WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Answer sheet not found' });
    }

    res.status(200).json({ message: 'Answer sheet deleted' });
  } catch (error) {
    console.error('❌ Error deleting answer sheet:', error);
    res.status(500).json({ message: 'Server error' });
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
