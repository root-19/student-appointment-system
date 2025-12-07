
import { Ticket, Document, User } from './types';

export const MOCK_USERS: User[] = [
  // Students (Format: 1st 2 letters of firstname + lastname @ptc.edu.ph, Password: lastname12345)
  { id: 'u1', name: 'Juan Dela Cruz', email: 'judelacruz@ptc.edu.ph', password: 'delacruz12345', role: 'Student', program: 'BSIT', section: '3A', studentId: '2023-1001', yearLevel: '3rd Year' },
  { id: 'u5', name: 'Johnmark Junio', email: 'jojunio@ptc.edu.ph', password: 'junio12345', role: 'Student', program: 'BSIT', section: '1A', studentId: '2024-1001', yearLevel: '1st Year' },
  { id: 'u6', name: 'Jockey Jorge', email: 'jojorge@ptc.edu.ph', password: 'jorge12345', role: 'Student', program: 'CCS', section: '2B', studentId: '2024-1002', yearLevel: '2nd Year' },
  { id: 'u7', name: 'Faisah Macaraguit', email: 'famacaraguit@ptc.edu.ph', password: 'macaraguit12345', role: 'Student', program: 'BSIT', section: '3C', studentId: '2024-1003', yearLevel: '3rd Year' },
  { id: 'u8', name: 'Hakim Maulay', email: 'hamaulay@ptc.edu.ph', password: 'maulay12345', role: 'Student', program: 'CCS', section: '1A', studentId: '2024-1004', yearLevel: '1st Year' },
  { id: 'u9', name: 'Jonas Nollora', email: 'jonollora@ptc.edu.ph', password: 'nollora12345', role: 'Student', program: 'BSIT', section: '4A', studentId: '2024-1005', yearLevel: '4th Year' },
  { id: 'u10', name: 'Ryle Angelo Verdejo', email: 'ryverdejo@ptc.edu.ph', password: 'verdejo12345', role: 'Student', program: 'BSIT', section: '2A', studentId: '2024-1006', yearLevel: '2nd Year' },

  // Staff (Passwords added for strict login)
  { id: 'u2', name: 'Maria Santos', email: 'registrar@ptc.edu.ph', password: 'registrar123', role: 'Registrar', department: 'Registrar Office' },
  { id: 'u3', name: 'Admin Staff', email: 'admin@ptc.edu.ph', password: 'admin123', role: 'Admin', department: 'Student Affairs' },
  { id: 'u4', name: 'System Admin', email: 'superadmin@ptc.edu.ph', password: 'superadmin123', role: 'SuperAdmin' },
  { id: 'u11', name: 'Academic Staff', email: 'academic@ptc.edu.ph', password: 'academic123', role: 'Academic', department: 'Academic Affairs' },
];

// Helper arrays for random data generation
const REGISTRAR_ISSUES = [
  { title: 'Grade Inquiry for Math', sub: 'Grade Correction' },
  { title: 'Request for TOR', sub: 'Transcript of Records (TOR)' },
  { title: 'Cannot Enroll in PE', sub: 'Enrollment Issues' },
  { title: 'Certification of Grades', sub: 'Certifications' },
  { title: 'Add Subject Request', sub: 'Add/Drop Subjects' }
];

const ADMIN_ISSUES = [
  { title: 'Lost School ID', sub: 'Student ID Replacement' },
  { title: 'Aircon Leaking Room 304', sub: 'Facilities Concerns' },
  { title: 'Request for Good Moral', sub: 'Other Administrative' },
  { title: 'Wi-Fi Connection Issue', sub: 'School Maintenance Requests' },
  { title: 'Tuition Payment Verification', sub: 'Payment Slips / Receipts' }
];

const ACADEMIC_ISSUES = [
    { title: 'Clarification on Math Grades', sub: 'Grades Inquiry / Clarification' },
    { title: 'Conflict in Schedule', sub: 'Class Schedule Issues' },
    { title: 'Missing Modules in LMS', sub: 'Learning Materials Requests' },
    { title: 'Inquiry on Special Exam', sub: 'Examination Concerns' },
    { title: 'Consultation for Shifting', sub: 'Academic Advising / Consultation' },
    { title: 'Incorrect Absences Record', sub: 'Attendance Concerns' }
];

const PRIORITIES: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
const STATUSES: ('Pending' | 'In Progress' | 'Resolved')[] = ['Pending', 'In Progress', 'Resolved'];

// Function to generate tickets
const generateMockTickets = (): Ticket[] => {
  const tickets: Ticket[] = [];
  let ticketCounter = 1;

  const students = MOCK_USERS.filter(u => u.role === 'Student');

  students.forEach(student => {
    // Generate 3 Registrar Tickets per student
    for (let i = 0; i < 3; i++) {
      const issue = REGISTRAR_ISSUES[i % REGISTRAR_ISSUES.length];
      tickets.push({
        id: `TICKET-${ticketCounter++}`,
        title: `${issue.title} - ${student.name.split(' ')[0]}`,
        category: 'Registrar',
        subcategory: issue.sub,
        priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        description: `I am requesting assistance regarding ${issue.sub}. Please help check my records. Thank you.`,
        submittedBy: student.id,
        studentName: student.name,
        submittedDate: `2024-03-${10 + i}`,
        lastUpdated: `2024-03-${12 + i}`,
        comments: i % 2 === 0 ? [
          { 
            id: `c${ticketCounter}`, 
            authorName: 'Maria Santos', 
            role: 'Registrar', 
            text: 'We have received your request. Please wait for 2-3 working days.', 
            timestamp: `2024-03-${11 + i} 10:00 AM` 
          }
        ] : []
      });
    }

    // Generate 3 Administrative Tickets per student
    for (let i = 0; i < 3; i++) {
      const issue = ADMIN_ISSUES[i % ADMIN_ISSUES.length];
      tickets.push({
        id: `TICKET-${ticketCounter++}`,
        title: `${issue.title}`,
        category: 'Administrative',
        subcategory: issue.sub,
        priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        description: `This is a report regarding ${issue.title}. It needs attention as soon as possible.`,
        submittedBy: student.id,
        studentName: student.name,
        submittedDate: `2024-03-${15 + i}`,
        lastUpdated: `2024-03-${16 + i}`,
        comments: []
      });
    }

    // Generate 3 Academic Tickets per student
    for (let i = 0; i < 3; i++) {
        const issue = ACADEMIC_ISSUES[i % ACADEMIC_ISSUES.length];
        tickets.push({
          id: `TICKET-${ticketCounter++}`,
          title: `${issue.title}`,
          category: 'Academic',
          subcategory: issue.sub,
          priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
          status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
          description: `I have a concern regarding my ${issue.sub}. Please advise on the next steps.`,
          submittedBy: student.id,
          studentName: student.name,
          submittedDate: `2024-03-${18 + i}`,
          lastUpdated: `2024-03-${18 + i}`,
          comments: []
        });
      }
  });

  return tickets;
};

export const MOCK_TICKETS: Ticket[] = generateMockTickets();

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', name: 'Form 137.pdf', type: 'PDF', size: '2.4 MB', uploadDate: '2024-03-10', status: 'Pending', studentName: 'Juan Dela Cruz' },
  { id: 'd2', name: 'Scholarship_Req.jpg', type: 'Image', size: '1.1 MB', uploadDate: '2024-03-08', status: 'Approved', studentName: 'Juan Dela Cruz' },
];

export const CHART_DATA = [
  { name: 'Mon', tickets: 12, resolved: 8 },
  { name: 'Tue', tickets: 19, resolved: 15 },
  { name: 'Wed', tickets: 15, resolved: 10 },
  { name: 'Thu', tickets: 22, resolved: 20 },
  { name: 'Fri', tickets: 28, resolved: 25 },
];
