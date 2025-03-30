import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule]
})
export class StudentsPage {
  BASE_URL = 'http://192.168.254.113:5001';

  classes: any[] = [];
  selectedClass: any = null;
  newClassName: string = '';  
  newStudentName: string = '';
  selectedGradeLevel: string = ''; 
  gradeLevels: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']; 

  isEditingClass: any = {}; 
  isEditingStudent: any = {}; 
  editedClassName: any = {}; 
  editedStudentData: any = {}; 

  constructor(private http: HttpClient) {
    this.fetchClasses();
  }

  // ✅ Fetch all classes with students
  fetchClasses() {
    this.http.get<any[]>(`${this.BASE_URL}/classes`).subscribe(
      (response) => {
        this.classes = response;
        console.log("✅ Classes with students:", this.classes);
      },
      (error) => {
        console.error("❌ Error fetching classes:", error);
        alert("Failed to load classes. Check server connection.");
      }
    );
  }

  // ✅ Select a class
  selectClass(classItem: any) {
    this.selectedClass = classItem;
  }

  // ✅ Add a new class
  addClass() {
    if (!this.newClassName.trim()) {
      alert("Please enter a class name.");
      return;
    }

    const newClass = { name: this.newClassName, teacher_id: 1 };

    this.http.post(`${this.BASE_URL}/classes`, newClass).subscribe(
      response => {
        console.log("✅ Class added:", response);
        alert("Class added successfully!");
        this.newClassName = ''; 
        this.fetchClasses();
      },
      error => {
        console.error("❌ Error adding class:", error);
        alert("Failed to add class.");
      }
    );
  }

  // ✅ Start Editing Class
  startEditingClass(classItem: any) {
    this.isEditingClass[classItem.id] = true;
    this.editedClassName[classItem.id] = classItem.name;
  }

  // ✅ Save Edited Class
  saveEditedClass(classItem: any) {
    const updatedClass = { ...classItem, name: this.editedClassName[classItem.id] };

    this.http.put(`${this.BASE_URL}/classes/${classItem.id}`, updatedClass)
      .subscribe(
        response => {
          console.log("✅ Class updated successfully:", response);
          alert("Class updated successfully!");
          this.isEditingClass[classItem.id] = false;
          this.fetchClasses();
        },
        error => {
          console.error("❌ Error updating class:", error);
          alert("Failed to update class.");
        }
      );
  }

  // ✅ Cancel Class Edit
  cancelEditClass(classItem: any) {
    this.isEditingClass[classItem.id] = false;
  }

  // ✅ Delete a class
  deleteClass(classItem: any) {
    if (confirm(`Are you sure you want to delete class: ${classItem.name}?`)) {
      this.http.delete(`${this.BASE_URL}/classes/${classItem.id}`).subscribe(
        response => {
          console.log("✅ Class deleted:", response);
          alert("Class deleted successfully!");
          this.selectedClass = null;
          this.fetchClasses();
        },
        error => {
          console.error("❌ Error deleting class:", error);
          alert("Failed to delete class.");
        }
      );
    }
  }

  // ✅ Add a student
  addStudent() {
    if (!this.newStudentName.trim() || !this.selectedClass || !this.selectedGradeLevel) {
      alert("Please enter a student name, grade level, and select a class.");
      return;
    }

    const newStudent = {
      name: this.newStudentName,
      grade_level: this.selectedGradeLevel,
      class_id: this.selectedClass.id
    };

    this.http.post(`${this.BASE_URL}/students`, newStudent).subscribe(
      response => {
        console.log("✅ Student added:", response);
        alert("Student added successfully!");
        this.newStudentName = ''; 
        this.selectedGradeLevel = ''; 
        this.fetchClasses();
      },
      error => {
        console.error("❌ Error adding student:", error);
        alert("Failed to add student.");
      }
    );
  }

  // ✅ Start Editing Student
  startEditingStudent(student: any) {
    this.isEditingStudent[student.id] = true;
    this.editedStudentData[student.id] = { ...student }; // Make a copy
  }

  // ✅ Save Edited Student
  saveEditedStudent(student: any) {
    this.http.put(`${this.BASE_URL}/students/${student.id}`, this.editedStudentData[student.id])
      .subscribe(
        response => {
          console.log("✅ Student updated successfully:", response);
          alert("Student updated successfully!");
          this.isEditingStudent[student.id] = false;
          this.fetchClasses();
        },
        error => {
          console.error("❌ Error updating student:", error);
          alert("Failed to update student.");
        }
      );
  }

  // ✅ Cancel Student Edit
  cancelEditStudent(student: any) {
    this.isEditingStudent[student.id] = false;
  }

  // ✅ Delete a student
  deleteStudent(student: any) {
    if (confirm(`Are you sure you want to delete student: ${student.name}?`)) {
      this.http.delete(`${this.BASE_URL}/students/${student.id}`).subscribe(
        response => {
          console.log("✅ Student deleted:", response);
          alert("Student deleted successfully!");
          this.fetchClasses();
        },
        error => {
          console.error("❌ Error deleting student:", error);
          alert("Failed to delete student.");
        }
      );
    }
  }
}
