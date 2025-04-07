require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

// Debugging: Check if DATABASE_URL is loading
console.log("✅ DATABASE_URL:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing. Check your environment variables.");
    process.exit(1);
}

// ✅ Create a MySQL Connection Pool using Railway's Public Connection
const db = mysql.createPool(process.env.DATABASE_URL);

// ✅ Check Database Connection
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

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Fetch all classes with students
app.get("/classes", async (req, res) => {
    try {
        const [classes] = await db.query("SELECT * FROM classes");

        for (const classItem of classes) {
            const [students] = await db.query("SELECT * FROM students WHERE class_id = ?", [classItem.id]);
            classItem.students = students;
        }

        res.json(classes);
    } catch (error) {
        console.error("❌ Error fetching classes:", error.message);
        res.status(500).json({ error: "Database error." });
    }
});

// ✅ Fetch students for a specific class
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

// ✅ Add a new class
app.post("/classes", async (req, res) => {
    const { name, teacher_id } = req.body;

    if (!name || !teacher_id) {
        return res.status(400).json({ error: "Missing class name or teacher ID." });
    }

    try {
        const [result] = await db.query("INSERT INTO classes (name, teacher_id) VALUES (?, ?)", [name, teacher_id]);

        res.status(201).json({
            message: "✅ Class added successfully.",
            class: { id: result.insertId, name, teacher_id }
        });
    } catch (error) {
        console.error("❌ Error adding class:", error.message);
        res.status(500).json({ error: "Database error while adding class." });
    }
});

// ✅ Delete a class
app.delete("/classes/:classId", async (req, res) => {
    const classId = req.params.classId;

    try {
        // First, delete students in this class (to prevent foreign key constraint errors)
        await db.query("DELETE FROM students WHERE class_id = ?", [classId]);

        // Then, delete the class
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

// ✅ Add a new student
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

        res.status(201).json({
            message: "✅ Student added successfully.",
            student: { id: result.insertId, name, grade_level, class_id }
        });
    } catch (error) {
        console.error("❌ Error adding student:", error.message);
        res.status(500).json({ error: "Database error while adding student." });
    }
});

// ✅ Update a student by ID
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

// ✅ Update a class by ID
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

// ✅ Delete a student
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

// ✅ Add a new answer sheet
app.post('/answer-sheets', async (req, res) => {
    try {
        const { examTitle, subject, gradeLevel, questions } = req.body;

        // Save to database (assuming you have an "answer_sheets" table)
        const [result] = await db.execute(
            "INSERT INTO answer_sheets (exam_title, subject, grade_level, questions) VALUES (?, ?, ?, ?)",
            [examTitle, subject, gradeLevel, JSON.stringify(questions)]
        );

        res.status(201).json({ message: "Answer sheet saved successfully!", id: result.insertId });
    } catch (error) {
        console.error('❌ Error saving answer sheet:', error);
        res.status(500).json({ error: "Failed to save answer sheet" });
    }
});

// ✅ Fetch all answer sheets
app.get('/answer-sheets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM answer_sheets'); // Change pool to db
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching answer sheets:', error);
        res.status(500).json({ message: 'Error fetching answer sheets' });
    }
});
const bcrypt = require("bcrypt"); // You need to install this if not yet
const jwt = require("jsonwebtoken"); // Optional for JWT auth

// ✅ Register User
app.post("/register", async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
            [email, hashedPassword, role || "teacher"]
        );

        res.status(201).json({ message: "✅ User registered successfully", id: result.insertId });
    } catch (err) {
        console.error("❌ Registration error:", err.message);
        res.status(500).json({ error: "Registration failed." });
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

        // For simplicity, we just compare raw passwords (in real apps use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
