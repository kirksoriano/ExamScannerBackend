import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class StudentsPage implements OnInit {
  className: string = ''; // Declare the property

  BASE_URL = 'https://examscannerbackend-production.up.railway.app';
  teacherId: any; // ✅ changed from userId to teacherId
  classes: any[] = [];
  selectedClass: any;
  newClass: { name: string; teacher_id: number } = { name: '', teacher_id: 0 };
  newStudent: { name: string; grade_level: string } = { name: '', grade_level: '' };
  
  selectedGradeLevel: string = '';
  gradeLevels: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  isEditingClass: { [key: string]: boolean } = {};
  editedClassName: { [key: string]: string } = {};

  isEditingStudent: { [key: string]: boolean } = {};
  editedStudentData: { [key: string]: any } = {};

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.teacherId = user.id; // Set teacher ID
      console.log('Teacher ID from localStorage:', this.teacherId); // Log to check
      this.newClass.teacher_id = this.teacherId;
      this.fetchClasses();
    }
  }
  
  selectClass(classItem: any) {
    this.selectedClass = classItem;  // Set the selected class when clicked
    console.log('Selected class:', this.selectedClass);
  }

  fetchClasses() {
    this.http.get<any[]>(`${this.BASE_URL}/classes?teacher_id=${this.teacherId}`).subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (err) => {
        console.error('Error fetching classes:', err);
        alert('Failed to load classes.');
      }
    });
  }

  addClass() {
    if (!this.className.trim() || !this.teacherId) {
      alert('Invalid data. Please ensure all fields are filled.');
      return;
    }

    const newClass = {
      name: this.className.trim(),
      teacher_id: this.teacherId
    };

    console.log('New Class Data:', newClass);  // Log to verify class data
    this.http.post(`${this.BASE_URL}/classes`, newClass)
      .subscribe({
        next: (res) => {
          console.log('✅ Class added', res);
          this.className = '';  // Clear the class name after success
          this.fetchClasses(); // refresh class list
        },
        error: (err) => {
          console.error('❌ Failed to add class:', err);
          alert('Failed to add class');
        }
      });
  }

  fetchStudents(classId: number) {
    // Ensure you use the correct API endpoint with the teacher's ID
    this.http.get<any[]>(`${this.BASE_URL}/students?classId=${classId}&teacherId=${this.teacherId}`).subscribe({
      next: (data) => {
        this.selectedClass.students = data;
        console.log('Students fetched:', data); // Log the students
      },
      error: (err) => {
        console.error('Error fetching students:', err);
        alert('Failed to load students.');
      }
    });
  }

  addStudent() {
    if (!this.newStudent.name.trim() || !this.selectedGradeLevel || !this.selectedClass) {
      alert('Invalid data. Please ensure all fields are filled.');
      return;
    }

    const newStudentData = {
      name: this.newStudent.name.trim(),
      grade_level: this.selectedGradeLevel,
      class_id: this.selectedClass.id,
      teacher_id: this.teacherId // ✅ updated from user_id to teacher_id
    };

    this.http.post(`${this.BASE_URL}/students`, newStudentData).subscribe({
      next: () => {
        this.newStudent.name = ''; // Clear name after adding
        this.selectedGradeLevel = ''; // Clear grade level after adding
        this.fetchStudents(this.selectedClass.id);
      },
      error: (err) => {
        console.error('Error adding student:', err);
        alert('Failed to add student.');
      }
    });
  }

  startEditingClass(classItem: any) {
    this.isEditingClass[classItem.id] = true;
    this.editedClassName[classItem.id] = classItem.name;
  }

  saveEditedClass(classItem: any) {
    const updatedName = this.editedClassName[classItem.id];

    this.http.put(`${this.BASE_URL}/classes/${classItem.id}`, {
      name: updatedName,
      teacher_id: this.teacherId // ✅ updated key
    }).subscribe(() => {
      classItem.name = updatedName;
      this.cancelEditClass(classItem);
    });
  }

  cancelEditClass(classItem: any) {
    this.isEditingClass[classItem.id] = false;
    this.editedClassName[classItem.id] = '';
  }

  deleteClass(classItem: any) {
    this.http.delete(`${this.BASE_URL}/classes/${classItem.id}`).subscribe(() => {
      this.classes = this.classes.filter(c => c.id !== classItem.id);
      if (this.selectedClass?.id === classItem.id) {
        this.selectedClass = null;
      }
    });
  }

  startEditingStudent(student: any) {
    this.isEditingStudent[student.id] = true;
    this.editedStudentData[student.id] = {
      name: student.name,
      grade_level: student.grade_level
    };
  }

  saveEditedStudent(student: any) {
    const updatedStudent = this.editedStudentData[student.id];

    this.http.put(`${this.BASE_URL}/students/${student.id}`, updatedStudent).subscribe(() => {
      student.name = updatedStudent.name;
      student.grade_level = updatedStudent.grade_level;
      this.cancelEditStudent(student);
    });
  }

  cancelEditStudent(student: any) {
    this.isEditingStudent[student.id] = false;
    delete this.editedStudentData[student.id];
  }

  deleteStudent(student: any) {
    this.http.delete(`${this.BASE_URL}/students/${student.id}`).subscribe(() => {
      this.selectedClass.students = this.selectedClass.students.filter((s: any) => s.id !== student.id);
    });
  }
}
