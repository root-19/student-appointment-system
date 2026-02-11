
export type Role = 'Student' | 'Registrar' | 'Admin' | 'SuperAdmin' | 'Academic';
export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
export type Priority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Registrar' | 'Administrative' | 'Academic';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added password field for strict authentication
  role: Role;
  department?: string;
  program?: string;
  yearLevel?: string;
  section?: string;
  studentId?: string;
  avatar?: string;
  status?: 'Active' | 'Inactive';
  documentUrl?: string;
}

export interface TicketAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: TicketCategory;
  subcategory?: string;
  priority: Priority;
  status: TicketStatus;
  description: string;
  submittedBy: string; // User ID
  studentName: string;
  submittedDate: string;
  lastUpdated: string;
  comments: Comment[];
  attachment?: TicketAttachment;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface Comment {
  id: string;
  authorName: string;
  role: Role;
  text: string;
  timestamp: string;
  attachment?: TicketAttachment;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  studentName: string;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  yearLevel: string;
  section: string;
  password?: string; // Not sent to API, only used for local validation
  documentName: string;
  documentUrl?: string; // URL for the uploaded file
  documentType?: string; // MIME type
  status: 'Pending' | 'Approved' | 'Rejected';
  dateSubmitted: string;
}

export interface Notification {
  id: string;
  recipientId: string; // User ID of the student
  title: string;
  message: string;
  type: 'StatusUpdate' | 'NewComment' | 'System' | 'Appointment';
  timestamp: string;
  isRead: boolean;
  ticketId?: string; // Optional link to a specific ticket
}

export interface DashboardProps {
  user: User;
  onLogout: () => void;
}