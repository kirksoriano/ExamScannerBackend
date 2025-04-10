require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5001;

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

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            [email, hashedPassword, name]
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

        if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password)) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        // Create a JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,  // This is your teacher_id
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


// Fetch Answer Sheets for a class
app.get('/answer-sheets', async (req, res) => {
  const { classId } = req.query;
  try {
    const [rows] = await db.query('SELECT * FROM answer_sheets WHERE class_id = ?', [classId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Add a new Answer Sheet
app.post('/answer-sheets', async (req, res) => {
  const { class_id, name, file_url } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO answer_sheets (class_id, name, file_url) VALUES (?, ?, ?)', 
      [class_id, name, file_url]
    );
    res.status(201).json({ id: result.insertId, class_id, name, file_url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Edit an Answer Sheet
app.put('/answer-sheets/:id', async (req, res) => {
  const { id } = req.params;
  const { name, file_url } = req.body;
  try {
    await db.query('UPDATE answer_sheets SET name = ?, file_url = ? WHERE id = ?', [name, file_url, id]);
    res.status(200).send('Answer Sheet updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Delete an Answer Sheet
app.delete('/answer-sheets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM answer_sheets WHERE id = ?', [id]);
    res.status(200).send('Answer Sheet deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
