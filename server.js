require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Use Railway Environment Variables for Database Connection
const db = mysql.createPool({
    host: process.env.MYSQLHOST, 
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ Check if database connection is successful
db.getConnection()
    .then(() => console.log("✅ Connected to Railway MySQL Database"))
    .catch(err => console.error("❌ Database connection failed:", err.message));

// ✅ Test API Route
app.get("/", (req, res) => {
    res.send("🚀 Exam Scanner Backend is running!");
});

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

// ✅ DELETE a class by ID
app.delete("/classes/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        // Delete students under the class first (to maintain foreign key constraints)
        await db.query("DELETE FROM students WHERE class_id = ?", [id]);

        // Delete the class
        const [result] = await db.query("DELETE FROM classes WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "❌ Class not found." });
        }

        res.json({ message: "✅ Class deleted successfully." });
    } catch (error) {
        console.error("❌ Error deleting class:", error.message);
        res.status(500).json({ error: "Database error while deleting class." });
    }
});

// ✅ DELETE a student by ID
app.delete("/students/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const [result] = await db.query("DELETE FROM students WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "❌ Student not found." });
        }

        res.json({ message: "✅ Student deleted successfully." });
    } catch (error) {
        console.error("❌ Error deleting student:", error.message);
        res.status(500).json({ error: "Database error while deleting student." });
    }
});

// ✅ Start the Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
