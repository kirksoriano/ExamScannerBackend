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

// Endpoint to verify the JWT token (example usage in protected routes)
app.post('/verify-token', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        res.json({ message: 'Token valid', user: decoded });
    });
});

// ✅ Fetch all classes for a specific teacher
app.get('/classes/:teacher_id', async (req, res) => {
    const teacherId = req.params.teacher_id;
    const [rows] = await db.execute('SELECT * FROM classes WHERE teacher_id = ?', [teacherId]);
    res.json(rows);
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

// ✅ Update a class
app.put("/classes/:id", async (req, res) => {
    const { name } = req.body;
    const id = parseInt(req.params.id);

    if (!id || !name) {
        return res.status(400).json({ error: "Missing class name or ID." });
    }

    try {
        const [result] = await db.query("UPDATE classes SET name = ? WHERE id = ?", [name, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "❌ Class not found." });
        }

        res.json({ message: "✅ Class updated successfully." });
    } catch (error) {
        console.error("❌ Error updating class:", error.message);
        res.status(500).json({ error: "Database error while updating class." });
    }
});

// ✅ Delete a class
app.delete("/classes/:classId", async (req, res) => {
    const classId = req.params.classId;

    try {
        await db.query("DELETE FROM students WHERE class_id = ?", [classId]);
        const [result] = await db.query("DELETE FROM classes WHERE id = ?", [classId]);

        if (result.affectedRows > 0) {
            res.json({ message: "✅ Class deleted successfully." });
        } else {
            res.status(404).json({ error: "Class not found." });
        }
    } catch (error) {
        console.error("❌ Error deleting class:", error.message);
        res.status(500).json({ error: "Database error while deleting class." });
    }
});

// ✅ Get students by class
app.get("/classes/:classId/students", async (req, res) => {
    const classId = req.params.classId;

    try {
        const [students] = await db.query("SELECT * FROM students WHERE class_id = ?", [classId]);
        res.json(students);
    } catch (error) {
        console.error("❌ Error fetching students:", error.message);
        res.status(500).json({ error: "Database error while fetching students." });
    }
});

// ✅ Add student
app.post("/students", async (req, res) => {
    const { name, grade_level, class_id } = req.body;

    if (!name || !grade_level || !class_id) {
        return res.status(400).json({ error: "Missing student name, grade level, or class ID." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO students (name, grade_level, class_id) VALUES (?, ?, ?)",
            [name, grade_level, class_id]
        );

        res.status(201).json({ message: "✅ Student added successfully.", student: { id: result.insertId, name, grade_level, class_id } });
    } catch (error) {
        console.error("❌ Error adding student:", error.message);
        res.status(500).json({ error: "Database error while adding student." });
    }
});

// ✅ Update student
app.put("/students/:id", async (req, res) => {
    const { name, grade_level, class_id } = req.body;
    const id = parseInt(req.params.id);

    if (!id || !name || !grade_level || !class_id) {
        return res.status(400).json({ error: "Missing student data." });
    }

    try {
        const [result] = await db.query(
            "UPDATE students SET name = ?, grade_level = ?, class_id = ? WHERE id = ?",
            [name, grade_level, class_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "❌ Student not found." });
        }

        res.json({ message: "✅ Student updated successfully." });
    } catch (error) {
        console.error("❌ Error updating student:", error.message);
        res.status(500).json({ error: "Database error while updating student." });
    }
});

// ✅ Delete student
app.delete("/students/:studentId", async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const [result] = await db.query("DELETE FROM students WHERE id = ?", [studentId]);

        if (result.affectedRows > 0) {
            res.json({ message: "✅ Student deleted successfully." });
        } else {
            res.status(404).json({ error: "Student not found." });
        }
    } catch (error) {
        console.error("❌ Error deleting student:", error.message);
        res.status(500).json({ error: "Database error while deleting student." });
    }
});

// ✅ Add answer sheet
app.post('/answer-sheets', async (req, res) => {
    const { teacher_id, answerSheet } = req.body;

    if (!teacher_id || !answerSheet) {
        return res.status(400).json({ error: 'Missing teacher_id or answer sheet data.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO answer_sheets (teacher_id, answers) VALUES (?, ?)',
            [teacher_id, JSON.stringify(answerSheet)]
        );
        res.status(200).json({ message: 'Answer sheet saved successfully.' });
    } catch (err) {
        console.error('❌ Error saving answer sheet:', err.message);
        res.status(500).json({ error: 'Error saving answer sheet', message: err.message });
    }
});

// ✅ Get answer sheets for a specific teacher
app.get('/answer-sheets', async (req, res) => {
    const teacherId = req.query.teacherId;

    if (!teacherId) {
        return res.status(400).json({ error: 'Missing teacherId' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM answer_sheets WHERE teacher_id = ?', [teacherId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching answer sheets:', error.message);
        res.status(500).json({ message: 'Error fetching answer sheets' });
    }
});

// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
