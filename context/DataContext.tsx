import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Ticket, Document, Role, RegistrationRequest, Comment, Notification, Priority, TicketAttachment } from '../types';
import { NewTicketInput } from '../services/ticketService';
import {
  authAPI,
  userAPI,
  ticketAPI,
  commentAPI,
  documentAPI,
  notificationAPI,
  registrationRequestAPI,
} from '../services/api';

interface DataContextType {
  currentUser: User | null;
  users: User[];
  tickets: Ticket[];
  documents: Document[];
  notifications: Notification[];
  pendingRegistrations: RegistrationRequest[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addTicket: (ticket: NewTicketInput) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: Priority) => Promise<void>;
  setTicketAppointment: (ticketId: string, date: string, time: string) => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate' | 'status'>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  registerUser: (data: Omit<RegistrationRequest, 'id' | 'status' | 'dateSubmitted'>) => Promise<void>;
  approveRegistration: (id: string) => Promise<void>;
  rejectRegistration: (id: string) => Promise<void>;
  addComment: (ticketId: string, text: string, attachmentFile?: File | null) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadData();
    }
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Load tickets based on user role
      const ticketsParams: any = {};
      if (currentUser.role === 'Student') {
        ticketsParams.user_id = currentUser.id;
      } else if (currentUser.role === 'Registrar') {
        ticketsParams.category = 'Registrar';
      } else if (currentUser.role === 'Admin') {
        ticketsParams.category = 'Administrative';
      } else if (currentUser.role === 'Academic') {
        ticketsParams.category = 'Academic';
      }
      // SuperAdmin sees all tickets (no filtering)
      const ticketsData = await ticketAPI.getAll(ticketsParams);
      setTickets(ticketsData);

      // Load documents
      const documentsParams: any = {};
      if (currentUser.role === 'Student') {
        documentsParams.user_id = currentUser.id;
      }
      const documentsData = await documentAPI.getAll(documentsParams);
      setDocuments(documentsData);

      // Load notifications
      const notificationsData = await notificationAPI.getAll();
      setNotifications(notificationsData);

      // Load users (for admin/superadmin/registrar/academic)
      if (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin' || currentUser.role === 'Registrar' || currentUser.role === 'Academic') {
        const usersData = await userAPI.getAll();
        setUsers(usersData);
      }

      // Load registration requests (for admin/superadmin)
      if (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') {
        const requestsData = await registrationRequestAPI.getAll();
        setPendingRegistrations(requestsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string): Promise<boolean> => {
    try {
      const { user, token } = await authAPI.login(email);
      
      if (user.status === 'Inactive') {
        alert("Your account has been deactivated. Please contact the administrator.");
        return false;
      }

      setCurrentUser(user);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Invalid email.';
      alert(message);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setUsers([]);
      setTickets([]);
      setDocuments([]);
      setNotifications([]);
      setPendingRegistrations([]);
    }
  };

  const addTicket = async (ticketData: NewTicketInput): Promise<void> => {
    if (!currentUser) return;

    try {
      const newTicket = await ticketAPI.create({
        title: ticketData.title,
        category: ticketData.category,
        subcategory: ticketData.subcategory,
        priority: ticketData.priority,
        description: ticketData.description,
        attachment: ticketData.attachment,
      });
      setTickets(prev => [newTicket, ...prev]);
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']): Promise<void> => {
    try {
      const updatedTicket = await ticketAPI.updateStatus(ticketId, status);
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      
      // Refresh notifications
      const notificationsData = await notificationAPI.getAll();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  };

  const updateTicketPriority = async (ticketId: string, priority: Priority): Promise<void> => {
    try {
      const updatedTicket = await ticketAPI.updatePriority(ticketId, priority);
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      throw error;
    }
  };

  const setTicketAppointment = async (ticketId: string, date: string, time: string): Promise<void> => {
    try {
      const updatedTicket = await ticketAPI.setAppointment(ticketId, date, time);
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      
      // Refresh notifications
      const notificationsData = await notificationAPI.getAll();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error setting appointment:', error);
      throw error;
    }
  };

  const addComment = async (ticketId: string, text: string, attachmentFile?: File | null): Promise<void> => {
    if (!currentUser) return;

    try {
      const newComment = await commentAPI.create(ticketId, text, attachmentFile || null);
      
      // Update ticket with new comment
      const ticket = await ticketAPI.getById(ticketId);
      setTickets(prev => prev.map(t => t.id === ticketId ? ticket : t));
      
      // Refresh notifications
      const notificationsData = await notificationAPI.getAll();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string): Promise<void> => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    if (!currentUser) return;

    try {
      await notificationAPI.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  };

  const addDocument = async (docData: Omit<Document, 'id' | 'uploadDate' | 'status'>): Promise<void> => {
    if (!docData.name || !(docData as any).file) {
      throw new Error('Document name and file are required');
    }

    try {
      const newDoc = await documentAPI.create(docData.name, (docData as any).file);
      setDocuments(prev => [newDoc, ...prev]);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
    try {
      const newUser = await userAPI.create(userData);
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await userAPI.update(userId, updates);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      // If the updated user is the current user, update session state
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
        localStorage.setItem('ticket_sys_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      await userAPI.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const registerUser = async (data: Omit<RegistrationRequest, 'id' | 'status' | 'dateSubmitted'>): Promise<void> => {
    try {
      const newRequest = await registrationRequestAPI.create({
        name: data.name,
        email: data.email,
        studentId: data.studentId,
        program: data.program,
        yearLevel: data.yearLevel,
        section: data.section,
        password: data.password || '',
        document: (data as any).document,
      });
      setPendingRegistrations(prev => [...prev, newRequest]);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const approveRegistration = async (id: string): Promise<void> => {
    try {
      await registrationRequestAPI.approve(id);
      setPendingRegistrations(prev => prev.filter(r => r.id !== id));
      
      // Refresh users list
      if (currentUser && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin')) {
        const usersData = await userAPI.getAll();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      throw error;
    }
  };

  const rejectRegistration = async (id: string): Promise<void> => {
    try {
      await registrationRequestAPI.reject(id);
      setPendingRegistrations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error rejecting registration:', error);
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, users, tickets, documents, pendingRegistrations, notifications, loading,
      login, logout, addTicket, updateTicketStatus, updateTicketPriority, setTicketAppointment, addComment, addDocument, 
      addUser, updateUser, deleteUser,
      registerUser, approveRegistration, rejectRegistration,
      markNotificationAsRead, clearAllNotifications, refreshData
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
