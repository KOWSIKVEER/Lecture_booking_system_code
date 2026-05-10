require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const StudentCourseMapping = require('../models/StudentCourseMapping');
const Class = require('../models/Class');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Note = require('../models/Note');
const Forum = require('../models/Forum');
const Timetable = require('../models/Timetable');
const AcademicPerformance = require('../models/AcademicPerformance');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lecture_booking_system';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Student.deleteMany({}), Faculty.deleteMany({}), Course.deleteMany({}),
      StudentCourseMapping.deleteMany({}), Class.deleteMany({}), Booking.deleteMany({}),
      Attendance.deleteMany({}), Assignment.deleteMany({}), Note.deleteMany({}),
      Forum.deleteMany({}), Timetable.deleteMany({}), AcademicPerformance.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    const admin = await Faculty.create({
      facultyId: '-1',
      password: 'admin123',
      name: 'System Administrator',
      email: 'admin@university.edu',
      department: 'Administration',
      is_coordinator: true,
      isAdmin: true,
      designation: 'Administrator'
    });
    console.log('👤 Admin created');

    // ─── FACULTY ──────────────────────────────────────────────────────────────
    const facultyData = [
      { facultyId: 'F001', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@university.edu', department: 'Computer Science', is_coordinator: true, designation: 'Professor', specialization: 'Machine Learning' },
      { facultyId: 'F002', name: 'Prof. Michael Chen', email: 'michael.chen@university.edu', department: 'Computer Science', is_coordinator: false, designation: 'Associate Professor', specialization: 'Web Development' },
      { facultyId: 'F003', name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@university.edu', department: 'Mathematics', is_coordinator: true, designation: 'Professor', specialization: 'Calculus & Linear Algebra' },
      { facultyId: 'F004', name: 'Prof. David Kim', email: 'david.kim@university.edu', department: 'Physics', is_coordinator: false, designation: 'Assistant Professor', specialization: 'Quantum Mechanics' },
      { facultyId: 'F005', name: 'Dr. Lisa Thompson', email: 'lisa.thompson@university.edu', department: 'Computer Science', is_coordinator: true, designation: 'Professor', specialization: 'Database Systems' }
    ];

    const faculties = await Faculty.create(facultyData.map(f => ({ ...f, password: 'faculty123' })));
    console.log('👨‍🏫 Faculty created');

    // ─── COURSES ──────────────────────────────────────────────────────────────
    const courseData = [
      { courseId: 'CS101', name: 'Introduction to Programming', department: 'Computer Science', credits: 4, semester: 1, coordinator: faculties[0]._id },
      { courseId: 'CS201', name: 'Data Structures & Algorithms', department: 'Computer Science', credits: 4, semester: 2, coordinator: faculties[0]._id },
      { courseId: 'CS301', name: 'Database Management Systems', department: 'Computer Science', credits: 3, semester: 3, coordinator: faculties[4]._id },
      { courseId: 'CS401', name: 'Machine Learning', department: 'Computer Science', credits: 4, semester: 4, coordinator: faculties[0]._id },
      { courseId: 'CS202', name: 'Web Development', department: 'Computer Science', credits: 3, semester: 2, coordinator: faculties[1]._id },
      { courseId: 'MA101', name: 'Engineering Mathematics I', department: 'Mathematics', credits: 4, semester: 1, coordinator: faculties[2]._id },
      { courseId: 'PH101', name: 'Engineering Physics', department: 'Physics', credits: 3, semester: 1, coordinator: faculties[3]._id }
    ];

    const courses = await Course.create(courseData);
    console.log('📚 Courses created');

    // ─── STUDENTS ─────────────────────────────────────────────────────────────
    const studentData = [
      { rollNumber: 'S2021001', name: 'Alice Williams', email: 'alice.w@student.edu', department: 'Computer Science', year: 3, semester: 5, gpa: 8.5, dob: new Date('2002-03-15'), contact: { phone: '555-0101' } },
      { rollNumber: 'S2021002', name: 'Bob Martinez', email: 'bob.m@student.edu', department: 'Computer Science', year: 3, semester: 5, gpa: 6.2, dob: new Date('2002-07-22'), contact: { phone: '555-0102' } },
      { rollNumber: 'S2021003', name: 'Carol Davis', email: 'carol.d@student.edu', department: 'Computer Science', year: 2, semester: 3, gpa: 9.1, dob: new Date('2003-01-10'), contact: { phone: '555-0103' } },
      { rollNumber: 'S2021004', name: 'Daniel Lee', email: 'daniel.l@student.edu', department: 'Mathematics', year: 2, semester: 3, gpa: 7.8, dob: new Date('2003-05-18'), contact: { phone: '555-0104' } },
      { rollNumber: 'S2021005', name: 'Eva Brown', email: 'eva.b@student.edu', department: 'Computer Science', year: 4, semester: 7, gpa: 5.5, dob: new Date('2001-11-30'), contact: { phone: '555-0105' } },
      { rollNumber: 'S2021006', name: 'Frank Wilson', email: 'frank.w@student.edu', department: 'Physics', year: 1, semester: 1, gpa: 7.0, dob: new Date('2004-02-14'), contact: { phone: '555-0106' } },
      { rollNumber: 'S2021007', name: 'Grace Taylor', email: 'grace.t@student.edu', department: 'Computer Science', year: 3, semester: 5, gpa: 8.9, dob: new Date('2002-09-05'), contact: { phone: '555-0107' } },
      { rollNumber: 'S2021008', name: 'Henry Anderson', email: 'henry.a@student.edu', department: 'Computer Science', year: 2, semester: 3, gpa: 6.8, dob: new Date('2003-12-20'), contact: { phone: '555-0108' } }
    ];

    const students = await Student.create(studentData.map(s => ({ ...s, password: 'student123' })));
    console.log('🎓 Students created');

    // ─── ENROLLMENTS ──────────────────────────────────────────────────────────
    const enrollments = [
      { student: students[0]._id, course: courses[0]._id },
      { student: students[0]._id, course: courses[1]._id },
      { student: students[0]._id, course: courses[2]._id },
      { student: students[0]._id, course: courses[3]._id },
      { student: students[1]._id, course: courses[0]._id },
      { student: students[1]._id, course: courses[1]._id },
      { student: students[1]._id, course: courses[4]._id },
      { student: students[2]._id, course: courses[1]._id },
      { student: students[2]._id, course: courses[2]._id },
      { student: students[3]._id, course: courses[5]._id },
      { student: students[4]._id, course: courses[0]._id },
      { student: students[4]._id, course: courses[3]._id },
      { student: students[5]._id, course: courses[6]._id },
      { student: students[6]._id, course: courses[1]._id },
      { student: students[6]._id, course: courses[3]._id },
      { student: students[7]._id, course: courses[0]._id },
      { student: students[7]._id, course: courses[4]._id }
    ];
    await StudentCourseMapping.insertMany(enrollments);
    console.log('📋 Enrollments created');

    // ─── TIMETABLE ────────────────────────────────────────────────────────────
    const timetableData = [
      { faculty: faculties[0]._id, course: courses[0]._id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: 'Room 101', academicYear: '2024-25' },
      { faculty: faculties[0]._id, course: courses[1]._id, dayOfWeek: 2, startTime: '11:00', endTime: '12:30', location: 'Room 102', academicYear: '2024-25' },
      { faculty: faculties[0]._id, course: courses[3]._id, dayOfWeek: 4, startTime: '14:00', endTime: '15:30', location: 'Lab 201', academicYear: '2024-25' },
      { faculty: faculties[1]._id, course: courses[4]._id, dayOfWeek: 1, startTime: '11:00', endTime: '12:30', location: 'Room 103', academicYear: '2024-25' },
      { faculty: faculties[1]._id, course: courses[4]._id, dayOfWeek: 3, startTime: '09:00', endTime: '10:30', location: 'Lab 202', academicYear: '2024-25' },
      { faculty: faculties[2]._id, course: courses[5]._id, dayOfWeek: 2, startTime: '09:00', endTime: '10:30', location: 'Room 201', academicYear: '2024-25' },
      { faculty: faculties[3]._id, course: courses[6]._id, dayOfWeek: 3, startTime: '11:00', endTime: '12:30', location: 'Lab 301', academicYear: '2024-25' },
      { faculty: faculties[4]._id, course: courses[2]._id, dayOfWeek: 5, startTime: '10:00', endTime: '11:30', location: 'Room 104', academicYear: '2024-25' }
    ];
    const timetables = await Timetable.insertMany(timetableData);
    console.log('📅 Timetable created');

    // ─── CLASSES ──────────────────────────────────────────────────────────────
    const now = new Date();
    const classData = [
      {
        course: courses[0]._id, faculty: faculties[0]._id,
        topic: 'Introduction to Variables and Data Types',
        description: 'Covering primitive types, variable declaration, and basic operations',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
        location: 'Room 101', minStudents: 5, maxStudents: 60, bookedCount: 3,
        status: 'scheduled', averageRating: 4.5, ratingCount: 12
      },
      {
        course: courses[1]._id, faculty: faculties[0]._id,
        topic: 'Binary Trees and Tree Traversal',
        description: 'In-order, pre-order, post-order traversal algorithms',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 25.5 * 60 * 60 * 1000),
        location: 'Room 102', minStudents: 5, maxStudents: 50, bookedCount: 8,
        status: 'scheduled', averageRating: 4.8, ratingCount: 20
      },
      {
        course: courses[3]._id, faculty: faculties[0]._id,
        topic: 'Neural Networks Fundamentals',
        description: 'Perceptrons, activation functions, backpropagation',
        startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 49.5 * 60 * 60 * 1000),
        location: 'Lab 201', minStudents: 10, maxStudents: 40, bookedCount: 15,
        status: 'scheduled', averageRating: 4.9, ratingCount: 35
      },
      {
        course: courses[4]._id, faculty: faculties[1]._id,
        topic: 'React Hooks Deep Dive',
        description: 'useState, useEffect, useContext, custom hooks',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        location: 'Lab 202', minStudents: 5, maxStudents: 45, bookedCount: 22,
        status: 'scheduled', averageRating: 4.7, ratingCount: 18
      },
      {
        course: courses[2]._id, faculty: faculties[4]._id,
        topic: 'SQL Joins and Subqueries',
        description: 'INNER, LEFT, RIGHT, FULL OUTER joins with practical examples',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 0.5 * 60 * 60 * 1000),
        location: 'Room 104', minStudents: 5, maxStudents: 55, bookedCount: 30,
        status: 'completed', averageRating: 4.6, ratingCount: 28
      },
      {
        course: courses[5]._id, faculty: faculties[2]._id,
        topic: 'Differential Equations',
        description: 'First and second order ODEs with applications',
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        location: 'Room 201', minStudents: 5, maxStudents: 60, bookedCount: 10,
        status: 'scheduled', averageRating: 4.3, ratingCount: 15
      }
    ];
    const classes = await Class.insertMany(classData);
    console.log('🏫 Classes created');

    // ─── BOOKINGS ─────────────────────────────────────────────────────────────
    const bookingData = [
      { student: students[0]._id, class: classes[0]._id, status: 'booked' },
      { student: students[0]._id, class: classes[1]._id, status: 'booked' },
      { student: students[0]._id, class: classes[4]._id, status: 'attended' },
      { student: students[1]._id, class: classes[0]._id, status: 'booked' },
      { student: students[1]._id, class: classes[4]._id, status: 'attended' },
      { student: students[2]._id, class: classes[1]._id, status: 'booked' },
      { student: students[4]._id, class: classes[2]._id, status: 'booked' },
      { student: students[6]._id, class: classes[1]._id, status: 'booked' },
      { student: students[6]._id, class: classes[2]._id, status: 'booked' }
    ];
    await Booking.insertMany(bookingData);
    console.log('🎫 Bookings created');

    // ─── ATTENDANCE ───────────────────────────────────────────────────────────
    const attendanceData = [
      { student: students[0]._id, class: classes[4]._id, course: courses[2]._id, status: 'present', markedBy: faculties[4]._id },
      { student: students[1]._id, class: classes[4]._id, course: courses[2]._id, status: 'present', markedBy: faculties[4]._id },
      { student: students[2]._id, class: classes[4]._id, course: courses[2]._id, status: 'absent', markedBy: faculties[4]._id }
    ];
    await Attendance.insertMany(attendanceData);
    console.log('✅ Attendance created');

    // ─── ASSIGNMENTS ──────────────────────────────────────────────────────────
    const assignmentData = [
      {
        title: 'Programming Assignment 1: Fibonacci Series',
        description: 'Implement Fibonacci series using recursion and iteration. Compare time complexity.',
        course: courses[0]._id, faculty: faculties[0]._id,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), totalMarks: 100
      },
      {
        title: 'DSA Assignment: Implement AVL Tree',
        description: 'Implement a self-balancing AVL tree with insert, delete, and search operations.',
        course: courses[1]._id, faculty: faculties[0]._id,
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), totalMarks: 100
      },
      {
        title: 'Database Design Project',
        description: 'Design an ER diagram and implement a relational database for a library management system.',
        course: courses[2]._id, faculty: faculties[4]._id,
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), totalMarks: 100
      },
      {
        title: 'ML Mini Project: Linear Regression',
        description: 'Implement linear regression from scratch and apply it to a real dataset.',
        course: courses[3]._id, faculty: faculties[0]._id,
        dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), totalMarks: 150
      }
    ];
    const assignments = await Assignment.insertMany(assignmentData);
    console.log('📝 Assignments created');

    // ─── NOTES ────────────────────────────────────────────────────────────────
    const noteData = [
      {
        title: 'Python Basics - Complete Reference',
        description: 'Comprehensive notes covering Python syntax, data types, control flow, and functions',
        course: courses[0]._id, faculty: faculties[0]._id, type: 'official',
        tags: ['python', 'basics', 'programming'],
        files: [{ filename: 'python-basics.pdf', originalName: 'Python Basics.pdf', path: '/uploads/notes/python-basics.pdf', mimetype: 'application/pdf', size: 2048000 }]
      },
      {
        title: 'Data Structures Cheat Sheet',
        description: 'Quick reference for arrays, linked lists, stacks, queues, trees, and graphs',
        course: courses[1]._id, faculty: faculties[0]._id, type: 'official',
        tags: ['dsa', 'cheatsheet', 'algorithms'],
        files: [{ filename: 'dsa-cheatsheet.pdf', originalName: 'DSA Cheat Sheet.pdf', path: '/uploads/notes/dsa-cheatsheet.pdf', mimetype: 'application/pdf', size: 1024000 }]
      },
      {
        title: 'SQL Query Reference Guide',
        description: 'Complete SQL reference with examples for SELECT, INSERT, UPDATE, DELETE, and JOINs',
        course: courses[2]._id, faculty: faculties[4]._id, type: 'official',
        tags: ['sql', 'database', 'queries'],
        files: [{ filename: 'sql-reference.pdf', originalName: 'SQL Reference.pdf', path: '/uploads/notes/sql-reference.pdf', mimetype: 'application/pdf', size: 3072000 }]
      },
      {
        title: 'Machine Learning Algorithms Overview',
        description: 'Overview of supervised, unsupervised, and reinforcement learning algorithms',
        course: courses[3]._id, faculty: faculties[0]._id, type: 'official',
        tags: ['ml', 'algorithms', 'ai'],
        files: [{ filename: 'ml-overview.pdf', originalName: 'ML Overview.pdf', path: '/uploads/notes/ml-overview.pdf', mimetype: 'application/pdf', size: 4096000 }]
      }
    ];
    await Note.insertMany(noteData);
    console.log('📄 Notes created');

    // ─── FORUMS ───────────────────────────────────────────────────────────────
    const forumData = [
      {
        title: 'Help needed: Understanding Recursion',
        content: 'I am struggling to understand how recursion works in Python. Can someone explain with a simple example?',
        course: courses[0]._id, authorType: 'Student', author: students[1]._id,
        tags: ['recursion', 'python', 'help'], likeCount: 5, replyCount: 3
      },
      {
        title: 'Announcement: Mid-term Exam Schedule',
        content: 'Dear students, the mid-term examination for CS201 will be held on the 15th of next month. Please prepare chapters 1-6.',
        course: courses[1]._id, authorType: 'Faculty', author: faculties[0]._id,
        tags: ['announcement', 'exam'], isAnnouncement: true, isPinned: true, likeCount: 12, replyCount: 8
      },
      {
        title: 'Best resources for learning React?',
        content: 'What are the best online resources for learning React.js? Looking for both free and paid options.',
        course: courses[4]._id, authorType: 'Student', author: students[0]._id,
        tags: ['react', 'resources', 'webdev'], likeCount: 8, replyCount: 5
      },
      {
        title: 'Discussion: Real-world applications of ML',
        content: 'Let us discuss how machine learning is being applied in various industries. Share your thoughts!',
        course: courses[3]._id, authorType: 'Faculty', author: faculties[0]._id,
        tags: ['ml', 'discussion', 'industry'], likeCount: 20, replyCount: 15
      }
    ];
    await Forum.insertMany(forumData);
    console.log('💬 Forums created');

    // ─── ACADEMIC PERFORMANCE ─────────────────────────────────────────────────
    const perfData = [
      { student: students[0]._id, course: courses[0]._id, semester: 1, internalMarks: 85, externalMarks: 78, totalMarks: 163, grade: 'A', gradePoints: 9, semesterGPA: 8.5 },
      { student: students[0]._id, course: courses[1]._id, semester: 2, internalMarks: 90, externalMarks: 82, totalMarks: 172, grade: 'A+', gradePoints: 10, semesterGPA: 8.5 },
      { student: students[1]._id, course: courses[0]._id, semester: 1, internalMarks: 65, externalMarks: 58, totalMarks: 123, grade: 'C', gradePoints: 6, semesterGPA: 6.2 },
      { student: students[2]._id, course: courses[1]._id, semester: 2, internalMarks: 95, externalMarks: 88, totalMarks: 183, grade: 'A+', gradePoints: 10, semesterGPA: 9.1 }
    ];
    await AcademicPerformance.insertMany(perfData);
    console.log('📊 Academic performance created');

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
    await Notification.insertMany([
      { recipientType: 'Student', recipient: students[0]._id, title: 'Class Reminder', message: 'Your class "Introduction to Variables" starts in 2 hours.', type: 'class' },
      { recipientType: 'Student', recipient: students[0]._id, title: 'New Assignment', message: 'New assignment posted for CS101.', type: 'assignment' },
      { recipientType: 'All', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 2-4 AM.', type: 'general' }
    ]);
    console.log('🔔 Notifications created');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('ADMIN:    facultyId: -1       | password: admin123');
    console.log('FACULTY:  facultyId: F001     | password: faculty123');
    console.log('STUDENT:  rollNumber: S2021001 | password: student123');
    console.log('─────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
