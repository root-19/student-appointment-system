
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Ticket, Document, Role, RegistrationRequest, Comment, Notification, Priority, TicketAttachment } from '../types';
import { MOCK_USERS, MOCK_TICKETS, MOCK_DOCUMENTS } from '../constants';
import { createTicketObject, NewTicketInput } from '../services/ticketService';

interface DataContextType {
  currentUser: User | null;
  users: User[];
  tickets: Ticket[];
  documents: Document[];
  notifications: Notification[];
  pendingRegistrations: RegistrationRequest[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addTicket: (ticket: NewTicketInput) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  updateTicketPriority: (ticketId: string, priority: Priority) => void;
  setTicketAppointment: (ticketId: string, date: string, time: string) => void;
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'status'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  registerUser: (data: Omit<RegistrationRequest, 'id' | 'status' | 'dateSubmitted'>) => void;
  approveRegistration: (id: string) => void;
  rejectRegistration: (id: string) => void;
  addComment: (ticketId: string, text: string, attachmentFile?: File | null) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Initialize users with 'Active' status if undefined to prevent them showing as Inactive
  const [users, setUsers] = useState<User[]>(MOCK_USERS.map(u => ({ ...u, status: u.status || 'Active' })));
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    // Mock Initial Notification
    {
      id: 'n1',
      recipientId: 'u1', // Juan Dela Cruz
      title: 'Welcome to the Portal',
      message: 'You can now submit tickets and view your documents.',
      type: 'System',
      timestamp: new Date().toLocaleDateString(),
      isRead: false
    }
  ]);

  // Persist user session
  useEffect(() => {
    const storedUser = localStorage.getItem('ticket_sys_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string) => {
    // Strict equality check for both email and password
    const detectedUser = users.find(u => u.email === email && u.password === password);

    if (detectedUser) {
      // Ensure status is checked
      if (detectedUser.status === 'Inactive') {
        alert("Your account has been deactivated. Please contact the administrator.");
        return false;
      }
      setCurrentUser(detectedUser);
      localStorage.setItem('ticket_sys_user', JSON.stringify(detectedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ticket_sys_user');
  };

  const addTicket = (ticketData: NewTicketInput) => {
    if (!currentUser) return;
    
    // Delegate logic to the service layer
    const newTicket = createTicketObject(ticketData, currentUser, tickets);
    
    setTickets([newTicket, ...tickets]);
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status, lastUpdated: new Date().toLocaleDateString() } : t));

    // Notification Logic
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        recipientId: ticket.submittedBy,
        title: 'Ticket Status Updated',
        message: `Your ticket #${ticket.id} has been marked as ${status}.`,
        type: 'StatusUpdate',
        timestamp: new Date().toLocaleString(),
        isRead: false,
        ticketId: ticket.id
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const updateTicketPriority = (ticketId: string, priority: Priority) => {
    setTickets(prevTickets => prevTickets.map(t => 
        t.id === ticketId 
            ? { ...t, priority, lastUpdated: new Date().toLocaleDateString() } 
            : t
    ));
  };

  const setTicketAppointment = (ticketId: string, date: string, time: string) => {
    setTickets(tickets.map(t => t.id === ticketId ? { 
        ...t, 
        appointmentDate: date, 
        appointmentTime: time,
        lastUpdated: new Date().toLocaleDateString() 
    } : t));

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        const newNotification: Notification = {
            id: `notif-apt-${Date.now()}`,
            recipientId: ticket.submittedBy,
            title: 'Appointment Scheduled',
            message: `An appointment has been set for Ticket #${ticket.id} on ${date} at ${time}.`,
            type: 'Appointment',
            timestamp: new Date().toLocaleString(),
            isRead: false,
            ticketId: ticket.id
        };
        setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const addComment = (ticketId: string, text: string, attachmentFile?: File | null) => {
    if (!currentUser) return;

    let attachment: TicketAttachment | undefined;
    if (attachmentFile) {
        attachment = {
            name: attachmentFile.name,
            url: URL.createObjectURL(attachmentFile),
            type: attachmentFile.type
        };
    }

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorName: currentUser.name,
      role: currentUser.role,
      text: text,
      timestamp: new Date().toLocaleString(),
      attachment: attachment
    };

    setTickets(prevTickets => prevTickets.map(t => 
      t.id === ticketId 
        ? { ...t, comments: [...t.comments, newComment], lastUpdated: new Date().toLocaleDateString() }
        : t
    ));

    // Notification Logic
    const ticket = tickets.find(t => t.id === ticketId);
    
    // Only notify if the commenter is NOT the ticket owner (i.e., Admin/Registrar replied)
    if (ticket && currentUser.id !== ticket.submittedBy) {
      const newNotification: Notification = {
        id: `notif-c-${Date.now()}`,
        recipientId: ticket.submittedBy,
        title: 'New Comment',
        message: `${currentUser.role} ${currentUser.name} commented on ticket #${ticket.id}.`,
        type: 'NewComment',
        timestamp: new Date().toLocaleString(),
        isRead: false,
        ticketId: ticket.id
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAllNotifications = () => {
      if(!currentUser) return;
      setNotifications(prev => prev.filter(n => n.recipientId !== currentUser.id));
  }

  const addDocument = (docData: Omit<Document, 'id' | 'uploadDate' | 'status'>) => {
    const newDoc: Document = {
      ...docData,
      id: `doc${documents.length + 1}`,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Pending'
    };
    setDocuments([newDoc, ...documents]);
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u${users.length + 1}`,
      status: 'Active'
    };
    setUsers([...users, newUser]);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
    
    // If the updated user is the current user, update session state and local storage immediately
    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem('ticket_sys_user', JSON.stringify(updatedCurrentUser));
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const registerUser = (data: Omit<RegistrationRequest, 'id' | 'status' | 'dateSubmitted'>) => {
    const newRequest: RegistrationRequest = {
      ...data,
      id: `req_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Pending',
      dateSubmitted: new Date().toLocaleDateString()
    };
    setPendingRegistrations([...pendingRegistrations, newRequest]);
  };

  const approveRegistration = (id: string) => {
    const request = pendingRegistrations.find(r => r.id === id);
    if (request) {
      // Add to active users
      addUser({
        name: request.name,
        email: request.email,
        role: 'Student',
        studentId: request.studentId,
        program: request.program || 'BSIT',
        yearLevel: request.yearLevel || '1st Year',
        section: request.section || 'A',
        documentUrl: request.documentUrl // Include the document URL in the new user profile if needed
      });
      // Remove from pending
      setPendingRegistrations(pendingRegistrations.filter(r => r.id !== id));
    }
  };

  const rejectRegistration = (id: string) => {
    setPendingRegistrations(pendingRegistrations.filter(r => r.id !== id));
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, users, tickets, documents, pendingRegistrations, notifications,
      login, logout, addTicket, updateTicketStatus, updateTicketPriority, setTicketAppointment, addComment, addDocument, 
      addUser, updateUser, deleteUser,
      registerUser, approveRegistration, rejectRegistration,
      markNotificationAsRead, clearAllNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
