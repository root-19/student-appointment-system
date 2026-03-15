import axios, { AxiosInstance, AxiosError } from 'axios';
import { User, Ticket, Document, Notification, RegistrationRequest, Comment } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://school.cateringreservation.com.mx/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('ticket_sys_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/login', { email });
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('ticket_sys_user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('ticket_sys_user');
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('ticket_sys_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// User API
export const userAPI = {
  getAll: async (params?: { role?: string }): Promise<User[]> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: Omit<User, 'id'>): Promise<User> => {
    // Convert camelCase to snake_case for backend
    const payload: any = {
      name: userData.name,
      email: userData.email,
      password: userData.password || 'password123', // Default password if not provided
      role: userData.role,
      department: userData.department,
      program: userData.program,
      year_level: userData.yearLevel,
      section: userData.section,
      student_id: userData.studentId,
      status: userData.status || 'Active',
    };
    
    const response = await api.post('/users', payload);
    return response.data;
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Ticket API
export const ticketAPI = {
  getAll: async (params?: {
    status?: string;
    category?: string;
    user_id?: string;
    search?: string;
  }): Promise<Ticket[]> => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData: {
    title: string;
    category: string;
    subcategory?: string;
    priority: string;
    description: string;
    attachment?: File | null;
  }): Promise<Ticket> => {
    const formData = new FormData();
    formData.append('title', ticketData.title);
    formData.append('category', ticketData.category);
    if (ticketData.subcategory) {
      formData.append('subcategory', ticketData.subcategory);
    }
    formData.append('priority', ticketData.priority);
    formData.append('description', ticketData.description);
    if (ticketData.attachment) {
      formData.append('attachment', ticketData.attachment);
    }

    const response = await api.post('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, updates);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}/status`, { status });
    return response.data;
  },

  updatePriority: async (id: string, priority: string): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}/priority`, { priority });
    return response.data;
  },

  setAppointment: async (id: string, appointmentDate: string, appointmentTime: string): Promise<Ticket> => {
    const response = await api.post(`/tickets/${id}/appointment`, {
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },
};

// Comment API
export const commentAPI = {
  create: async (ticketId: string, text: string, attachment?: File | null): Promise<Comment> => {
    const formData = new FormData();
    formData.append('text', text);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await api.post(`/tickets/${ticketId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};

// Document API
export const documentAPI = {
  getAll: async (params?: { status?: string; user_id?: string }): Promise<Document[]> => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  create: async (name: string, file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);

    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Document> => {
    const response = await api.put(`/documents/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};

// Notification API
export const notificationAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  clearAll: async (): Promise<void> => {
    await api.delete('/notifications');
  },
};

// Registration Request API
export const registrationRequestAPI = {
  getAll: async (params?: { status?: string }): Promise<RegistrationRequest[]> => {
    const response = await api.get('/registration-requests', { params });
    return response.data;
  },

  create: async (data: {
    name: string;
    email: string;
    studentId: string;
    program: string;
    yearLevel: string;
    section: string;
    password: string;
    document: File;
  }): Promise<RegistrationRequest> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('student_id', data.studentId);
    formData.append('program', data.program);
    formData.append('year_level', data.yearLevel);
    formData.append('section', data.section);
    formData.append('password', data.password);
    formData.append('document', data.document);

    const response = await api.post('/registration-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  approve: async (id: string): Promise<void> => {
    await api.post(`/registration-requests/${id}/approve`);
  },

  reject: async (id: string): Promise<void> => {
    await api.post(`/registration-requests/${id}/reject`);
  },
};

export default api;

