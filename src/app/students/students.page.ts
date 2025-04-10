import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class StudentsPage implements OnInit {
  className: string = '';
  BASE_URL = 'https://examscannerbackend-production.up.railway.app';
  teacherId: any;
  students: any[] = [];
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

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      this.navCtrl.navigateRoot('/home');
      return;
    }

    const user = JSON.parse(userData);
    this.teacherId = user.id;
    this.newClass.teacher_id = this.teacherId;

    console.log('✅ Teacher ID loaded:', this.teacherId);

    this.fetchClasses();
  }


  fetchClasses() {
    if (!this.teacherId) return;

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
    if (!this.className.trim()) {
      alert('Class name is required.');
      return;
    }

    const newClassData = {
      name: this.className.trim(),
      teacher_id: this.teacherId
    };

    console.log('Submitting new class:', newClassData);

    this.http.post(`${this.BASE_URL}/classes`, newClassData).subscribe({
      next: (res) => {
        console.log('✅ Class added:', res);
        this.className = '';
        this.fetchClasses();
      },
      error: (err) => {
        console.error('❌ Failed to add class:', err);
        alert('Failed to add class.');
      }
    });
  }

  selectClass(classItem: any) {
    this.selectedClass = classItem;
    console.log('Selected class:', this.selectedClass);
    this.fetchStudents(classItem.id);  // Fetch students when a class is selected
  }
  
  fetchStudents(classId: number) {
    this.http.get<any[]>(`${this.BASE_URL}/classes/${classId}/students`).subscribe({
      next: (students) => {
        this.selectedClass.students = students;  // Populate students within the selectedClass object
        console.log('✅ Students fetched:', students);
      },
      error: (err) => {
        console.error('❌ Error fetching students:', err);
        alert('Failed to fetch students.');
      }
    });
  }
  
  

  addStudent() {
    if (!this.newStudent.name.trim() || !this.selectedGradeLevel || !this.selectedClass) {
      alert('Invalid data. Please ensure all fields are filled.');
      return;
    }

    // Adjusted student data object
    const newStudentData = {
      name: this.newStudent.name.trim(),  // Student's name
      grade_level: this.selectedGradeLevel,  // Selected grade level
      class_id: this.selectedClass.id  // The class the student is being added to
    };

    // Send POST request to backend to add student
    this.http.post(`${this.BASE_URL}/students`, newStudentData).subscribe({
      next: () => {
        // Clear input fields after adding the student
        this.newStudent.name = '';
        this.selectedGradeLevel = '';
        // Refresh student list
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
      teacher_id: this.teacherId
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
    const updatedStudent = {
      name: this.editedStudentData[student.id].name,
      class_id: this.selectedClass?.id
    };
  
    console.log('Submitting updated student:', updatedStudent);
  
    this.http.put(`${this.BASE_URL}/students/${student.id}`, updatedStudent).subscribe({
      next: () => {
        student.name = updatedStudent.name;
        student.grade_level = this.editedStudentData[student.id].grade_level; // Keep existing grade_level
        this.cancelEditStudent(student);
      },
      error: (err) => {
        console.error('❌ Error updating student:', err);
        alert('Failed to update student.');
      }
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
