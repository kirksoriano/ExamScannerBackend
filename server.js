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

// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
