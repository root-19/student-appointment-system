
import React, { useState, useEffect } from 'react';
import { DashboardProps, Ticket, User as UserType, TicketStatus, Priority } from '../types';
import { useData } from '../context/DataContext';
import { ticketAPI } from '../services/api';
import { Home, FileText, Settings, CheckCircle, Clock, AlertCircle, Search, User, Lock, Save, Camera, Mail, Building, Phone, ChevronRight, Calendar, MessageSquare, Send, BarChart2, PieChart as PieChartIcon, TrendingUp, Download, ArrowLeft, Info, Activity, Eye, EyeOff, Hash, BookOpen, Paperclip, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Modal, Select, Toast } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const RegistrarDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { tickets, users, updateTicketStatus, updateTicketPriority, setTicketAppointment, addComment, updateUser } = useData();
  const [view, setView] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Ticket View State
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('All');
  
  // Appointment State
  const [appointmentDate, setAppointmentDate] = useState('');

  // Pagination State (Tickets)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Student Records State
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 8; // Increased for table view

  // Comments
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Toast Notification
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Settings State
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    department: user.department || 'Registrar Office',
    phone: '+63 917 123 4567',
    bio: 'Dedicated registrar officer committed to student success and efficient document processing.'
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Reset appointment state when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
        setAppointmentDate(selectedTicket.appointmentDate || '');
    } else {
        // Clear appointment date when modal closes
        setAppointmentDate('');
    }
  }, [selectedTicket]);

  // --- Derived Data (Realtime) ---

  // 1. Stats - Filter strictly for Registrar tickets
  const registrarTickets = tickets.filter(t => t.category === 'Registrar'); 
  const pendingCount = registrarTickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = registrarTickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = registrarTickets.filter(t => t.status === 'Resolved').length;

  // Extract unique subcategories for filter
  const uniqueSubcategories = Array.from(new Set(registrarTickets.map(t => t.subcategory).filter(Boolean))) as string[];

  // 2. Ticket List Filtering & Sorting
  const filteredTickets = registrarTickets.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || 
        t.studentName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        t.title.toLowerCase().includes(ticketSearchTerm.toLowerCase());
      
      const matchesStatus = ticketFilterStatus === 'All' || t.status === ticketFilterStatus;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesSubcategory = subcategoryFilter === 'All' || t.subcategory === subcategoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSubcategory;
  }).sort((a, b) => {
      // Default to Newest Submitted Date
      const getDate = (dateStr: string) => {
          if (!dateStr) return 0;
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      const dateA = getDate(a.submittedDate);
      const dateB = getDate(b.submittedDate);
      return (dateB - dateA) || b.id.localeCompare(a.id);
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [ticketSearchTerm, ticketFilterStatus, priorityFilter, subcategoryFilter]);

  // Reset student pagination when search changes
  useEffect(() => {
    setStudentPage(1);
  }, [searchStudent]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 3. Student List Filtering
  const studentList = users.filter(u => u.role === 'Student').filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
    (s.studentId && s.studentId.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  // Calculate Student Pagination
  const totalStudentPages = Math.ceil(studentList.length / STUDENTS_PER_PAGE);
  const paginatedStudents = studentList.slice(
    (studentPage - 1) * STUDENTS_PER_PAGE,
    studentPage * STUDENTS_PER_PAGE
  );

  const getStudentTickets = (studentId: string) => {
    return tickets.filter(t => String(t.submittedBy) === String(studentId) && t.category === 'Registrar');
  };

  // 4. Analytics Data
  const totalTickets = registrarTickets.length;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;
  
  const STATUS_DATA = [
    { name: 'Resolved', value: resolvedCount, color: '#10b981' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Calculate weekly data from actual tickets
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.submittedDate).toISOString().split('T')[0];
        return ticketDate === dateStr;
      });
      
      const resolved = dayTickets.filter(t => t.status === 'Resolved').length;
      
      return {
        name: day,
        tickets: dayTickets.length,
        resolved: resolved
      };
    });
  };
  
  const WEEKLY_DATA = getWeeklyData();

  // --- Handlers ---

  const handleStatusUpdate = (newStatus: string) => {
      if (selectedTicket) {
          const status = newStatus as TicketStatus;
          updateTicketStatus(selectedTicket.id, status);
          setSelectedTicket({ ...selectedTicket, status: status });
          setToast({ message: `Ticket ${selectedTicket.id} updated to ${status}`, type: 'success' });
      }
  };

  const handlePriorityUpdate = (newPriority: string) => {
    if (selectedTicket) {
        const priority = newPriority as Priority;
        updateTicketPriority(selectedTicket.id, priority);
        setSelectedTicket({ ...selectedTicket, priority: priority });
        setToast({ message: `Ticket priority updated to ${priority}`, type: 'success' });
    }
  };

  const handleSetAppointment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedTicket && appointmentDate) {
          try {
              await setTicketAppointment(selectedTicket.id, appointmentDate, '');
              // Fetch updated ticket to get the latest data
              const updatedTicket = await ticketAPI.getById(selectedTicket.id);
              setSelectedTicket(updatedTicket);
              // Clear the appointment date input after successful submission
              setAppointmentDate('');
              setToast({ message: "Appointment set successfully.", type: 'success' });
          } catch (error) {
              console.error('Error setting appointment:', error);
              setToast({ message: "Failed to set appointment.", type: 'error' });
          }
      } else {
          setToast({ message: "Please select a date.", type: 'error' });
      }
  };

  const handlePostComment = () => {
      if (!selectedTicket || (!commentText.trim() && !commentFile)) return;
      
      addComment(selectedTicket.id, commentText, commentFile);
      
      let attachment: any = undefined;
      if (commentFile) {
          attachment = {
              name: commentFile.name,
              url: URL.createObjectURL(commentFile),
              type: commentFile.type
          };
      }

      const newComment = {
          id: `temp-${Date.now()}`,
          authorName: user.name,
          role: user.role,
          text: commentText,
          timestamp: new Date().toLocaleString(),
          attachment: attachment
      };
      
      setSelectedTicket({
          ...selectedTicket,
          comments: [...selectedTicket.comments, newComment]
      });

      setCommentText('');
      setCommentFile(null);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
          setIsSaving(false);
          setToast({ message: "Profile details updated successfully.", type: 'success' });
      }, 1000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser(user.id, { avatar: reader.result as string });
        setToast({ message: "Profile image updated successfully.", type: 'success' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwords.new !== passwords.confirm) {
          setToast({ message: "New passwords do not match.", type: 'error' });
          return;
      }
      setIsSaving(true);
      setTimeout(() => {
          setIsSaving(false);
          setPasswords({ current: '', new: '', confirm: '' });
          setToast({ message: "Password updated successfully.", type: 'success' });
      }, 1000);
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col h-full fixed left-0 top-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* ... Sidebar Content ... */}
        <div className="p-8 flex items-center space-x-4 border-b border-slate-50">
           <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <img
                  src="/assets/logo.png"
                  alt="PTC Logo"
                  className="h-8 w-8 object-contain"
                />
           </div>
           <div>
             <span className="font-bold text-xl text-slate-900 block leading-none">Registrar</span>
             <span className="text-xs text-purple-600 font-bold tracking-widest mt-1 block">PORTAL</span>
           </div>
        </div>
        
        <div className="px-6 pt-8 mb-4">
             <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                            Online
                        </p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    </div>
                </div>
                <p className="text-xs text-slate-500 truncate pl-1 opacity-80">{user.email}</p>
             </div>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-4">
           {[
             { id: 'home', label: 'Dashboard', icon: Home },
             { id: 'tickets', label: 'Ticket Requests', icon: FileText },
             { id: 'analytics', label: 'Analytics', icon: BarChart2 },
             { id: 'students', label: 'Student Records', icon: Search },
             { id: 'settings', label: 'Settings', icon: Settings },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => { setView(item.id); setSelectedTicket(null); }}
               className={`flex items-center w-full px-5 py-3.5 text-base font-medium rounded-2xl transition-all duration-200 group ${
                 view === item.id && !selectedTicket
                   ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 translate-x-1' 
                   : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
               }`}
             >
               <item.icon className={`mr-4 h-5 w-5 ${view === item.id && !selectedTicket ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} />
               {item.label}
             </button>
           ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
            <Button 
                variant="outline" 
                className="w-full py-6 text-base border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors rounded-2xl font-semibold" 
                onClick={onLogout}
            >
                Sign Out
            </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 md:ml-72 bg-white min-h-screen">
          
          {view === 'home' && (
              // ... Home View ...
              <div className="space-y-8 max-w-7xl mx-auto">
                  {/* Hero Header */}
                  <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl mb-8">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="relative z-10">
                          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}</h1>
                          <p className="text-slate-300 max-w-xl">
                              You have <span className="text-white font-bold">{pendingCount} pending</span> requests requiring your attention in the Registrar Portal.
                          </p>
                          <div className="mt-6 flex gap-3">
                              <Button onClick={() => setView('tickets')} className="bg-purple-600 hover:bg-purple-700 text-white border-none font-bold rounded-xl shadow-lg shadow-purple-500/20">
                                  Manage Requests
                              </Button>
                              <Button onClick={() => setView('analytics')} variant="outline" className="border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl">
                                  View Reports
                              </Button>
                          </div>
                      </div>
                  </div>
                  
                  {/* Stats KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Total Tickets Card */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-sm border border-purple-100">
                                      <FileText className="h-6 w-6" />
                                  </div>
                                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                      <TrendingUp className="h-3 w-3 mr-1" /> +12%
                                  </span>
                              </div>
                              <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalTickets}</h3>
                              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Requests</p>
                          </div>
                      </div>

                      {/* Action Needed Card (Pending) */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm border border-amber-100">
                                      <Clock className="h-6 w-6" />
                                  </div>
                                  {pendingCount > 0 && (
                                      <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-pulse">
                                          Action Needed
                                      </span>
                                  )}
                              </div>
                              <h3 className="text-3xl font-bold text-slate-900 mb-1">{pendingCount}</h3>
                              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pending Review</p>
                          </div>
                      </div>

                      {/* Processing Card (In Progress) */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                                      <Activity className="h-6 w-6" />
                                  </div>
                              </div>
                              <h3 className="text-3xl font-bold text-slate-900 mb-1">{inProgressCount}</h3>
                              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Processing</p>
                          </div>
                      </div>

                      {/* Completed Card (Resolved) */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
                                      <CheckCircle className="h-6 w-6" />
                                  </div>
                                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                      <TrendingUp className="h-3 w-3 mr-1" /> +5%
                                  </span>
                              </div>
                              <h3 className="text-3xl font-bold text-slate-900 mb-1">{resolvedCount}</h3>
                              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Completed</p>
                          </div>
                      </div>
                  </div>

                  {/* Recent Tickets List */}
                  <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                          <div>
                              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                              <p className="text-xs text-slate-500 mt-0.5">Latest ticket submissions and updates.</p>
                          </div>
                          <Button 
                              onClick={() => setView('tickets')}
                              className="bg-white text-purple-700 hover:bg-purple-50 border border-purple-100 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm hover:shadow"
                          >
                              View All Activity &rarr;
                          </Button>
                      </div>
                      
                      <Card className="border border-slate-200 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
                          <div className="divide-y divide-slate-100">
                              {registrarTickets.slice(0, 5).map(ticket => (
                                  <div key={ticket.id} className="bg-white p-4 hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => setSelectedTicket(ticket)}>
                                      <div className="flex flex-col md:flex-row justify-between gap-3">
                                          <div className="flex flex-col gap-1 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ticket.id}</span>
                                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{ticket.title}</h4>
                                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 ${
                                                      ticket.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                      ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                      'bg-blue-50 text-blue-600 border border-blue-100'
                                                  }`}>
                                                      {ticket.priority === 'High' && <AlertCircle className="h-3 w-3" />}
                                                      {ticket.priority}
                                                  </span>
                                              </div>
                                              <p className="text-xs text-slate-500 line-clamp-1 max-w-3xl">{ticket.description}</p>
                                              <div className="flex items-center flex-wrap gap-3 text-[10px] text-slate-400 mt-0.5">
                                                  <span className="flex items-center font-medium text-slate-600">
                                                      <User className="h-3 w-3 mr-1" /> {ticket.studentName}
                                                  </span>
                                                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {ticket.submittedDate}</span>
                                              </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 min-w-[100px] justify-end">
                                              <Badge className="text-[10px] px-2 py-0.5 rounded-full font-medium border-0" variant={ticket.status === 'Resolved' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'warning'}>
                                                  {ticket.status}
                                              </Badge>
                                              <div className="text-slate-300 group-hover:text-purple-600 transition-colors">
                                                  <ChevronRight className="h-4 w-4" />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </Card>
                  </div>
              </div>
          )}

          {view === 'analytics' && (
              // ... Analytics View ...
              <div className="space-y-10 max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                      <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl hover:shadow-lg transition-all p-8 flex items-center justify-between">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-2">Total Tickets</p>
                              <h2 className="text-5xl font-bold text-slate-900">{totalTickets}</h2>
                              <p className="text-emerald-600 font-medium mt-2 flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" /> +12% from last month
                              </p>
                            </div>
                            <div className="h-24 w-24 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <FileText className="h-10 w-10" />
                            </div>
                      </Card>
                      <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl hover:shadow-lg transition-all p-8 flex items-center justify-between">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-2">Resolution Rate</p>
                              <h2 className="text-5xl font-bold text-slate-900">{resolutionRate}%</h2>
                              <p className="text-emerald-600 font-medium mt-2 flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" /> High Efficiency
                              </p>
                            </div>
                            <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                      </Card>
                  </div>

                  <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-8 w-1 bg-purple-600 rounded-full"></div>
                          <h2 className="text-2xl font-bold text-slate-900">Performance Insights</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <BarChart2 className="h-5 w-5 text-slate-400" />
                                      Weekly Ticket Volume
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="h-[350px]">
                                  <ResponsiveContainer width="99%" height="100%">
                                      <BarChart data={WEEKLY_DATA} barSize={40}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                          <Tooltip 
                                              cursor={{fill: '#f8fafc'}}
                                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                          />
                                          <Bar dataKey="tickets" name="Total Tickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                          <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                                          <Legend />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </CardContent>
                          </Card>

                          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <PieChartIcon className="h-5 w-5 text-slate-400" />
                                      Status Distribution
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="h-[350px]">
                                  <ResponsiveContainer width="99%" height="100%">
                                      <PieChart>
                                          <Pie
                                              data={STATUS_DATA}
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={80}
                                              outerRadius={120}
                                              paddingAngle={5}
                                              dataKey="value"
                                          >
                                              {STATUS_DATA.map((entry, index) => (
                                                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                              ))}
                                          </Pie>
                                          <Tooltip 
                                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                              itemStyle={{fontWeight: 'bold'}}
                                          />
                                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                      </PieChart>
                                  </ResponsiveContainer>
                              </CardContent>
                          </Card>
                        </div>
                  </div>
              </div>
          )}

          {view === 'tickets' && (
              // ... Tickets View ...
              <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Ticket Requests</h1>
                          <p className="text-slate-500 text-lg mt-2">Manage and process all student inquiries in real-time.</p>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between gap-6 items-center sticky top-0 z-20">
                      <div className="flex flex-col gap-4 w-full xl:w-auto">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                                    <button
                                    key={status}
                                    onClick={() => setTicketFilterStatus(status as any)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                        ticketFilterStatus === status 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 transform scale-105' 
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    >
                                    {status}
                                    </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full sm:w-36 py-2.5 rounded-xl bg-slate-50 border-slate-200 font-medium text-sm"
                            >
                                <option value="All">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </Select>
                            <Select
                                value={subcategoryFilter}
                                onChange={(e) => setSubcategoryFilter(e.target.value)}
                                className="w-full sm:w-48 py-2.5 rounded-xl bg-slate-50 border-slate-200 font-medium text-sm"
                            >
                                <option value="All">All Concerns</option>
                                {uniqueSubcategories.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </Select>
                        </div>
                      </div>
                      
                      <div className="relative w-full xl:w-80">
                          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                          <Input 
                              placeholder="Search Ticket ID, Title..." 
                              className="pl-12 py-5 text-sm rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-purple-500 focus:border-purple-500 w-full transition-all"
                              value={ticketSearchTerm}
                              onChange={(e) => setTicketSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="grid gap-4">
                      {paginatedTickets.length > 0 ? (
                          paginatedTickets.map(ticket => (
                              <div key={ticket.id} className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 hover:border-purple-300 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                      <div className="space-y-2">
                                          <div className="flex items-center flex-wrap gap-2">
                                              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{ticket.id}</span>
                                              <h3 className="font-medium text-slate-900 text-base group-hover:text-purple-700 transition-colors">{ticket.title}</h3>
                                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 ${
                                                  ticket.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                  ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                  'bg-blue-50 text-blue-600 border border-blue-100'
                                              }`}>
                                                  {ticket.priority === 'High' && <AlertCircle className="h-3 w-3" />}
                                                  {ticket.priority}
                                              </span>
                                          </div>
                                          <p className="text-sm text-slate-600 max-w-2xl line-clamp-1">{ticket.description}</p>
                                          <div className="flex items-center flex-wrap gap-4 text-xs text-slate-400">
                                              <span className="flex items-center font-medium text-slate-600">
                                                  <User className="h-3.5 w-3.5 mr-1.5" /> {ticket.studentName}
                                              </span>
                                              <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5" /> {ticket.submittedDate}</span>
                                              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-600 border border-slate-100">{ticket.category}</span>
                                              {ticket.subcategory && (
                                                  <span className="px-2 py-0.5 bg-emerald-50 rounded text-emerald-700 border border-emerald-100">{ticket.subcategory}</span>
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex items-center justify-end gap-3">
                                          <Badge className="px-3 py-1 text-xs font-medium" variant={ticket.status === 'Resolved' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'warning'}>
                                              {ticket.status}
                                          </Badge>
                                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600" />
                                      </div>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                              <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                  <Search className="h-10 w-10 text-slate-400" />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-900">No tickets found</h3>
                              <p className="text-lg text-slate-500 mt-2">Try adjusting your search or filters.</p>
                              <Button 
                                  variant="outline" 
                                  className="mt-8 px-8 py-3 text-base"
                                  onClick={() => {
                                      setTicketSearchTerm('');
                                      setTicketFilterStatus('All');
                                      setPriorityFilter('All');
                                      setSubcategoryFilter('All');
                                  }}
                              >
                                  Clear Filters
                              </Button>
                          </div>
                      )}
                  </div>

                  {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-8">
                          <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                              Previous
                          </Button>
                          <div className="flex items-center space-x-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <button
                                      key={page}
                                      onClick={() => setCurrentPage(page)}
                                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                          currentPage === page
                                              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                              : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
                                      }`}
                                  >
                                      {page}
                                  </button>
                              ))}
                          </div>
                          <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                              Next
                          </Button>
                      </div>
                  )}
              </div>
          )}
          
          {/* ... Student Records View ... */}
          {view === 'students' && (
              // ... Student Records View content kept the same ...
              <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Student Records</h1>
                          <p className="text-slate-500 text-lg mt-2">View student profiles and their ticket history.</p>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6 items-center sticky top-0 z-20">
                      <div className="relative w-full md:max-w-md">
                          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                          <Input 
                              placeholder="Search by Name or Student ID..." 
                              className="pl-12 py-4 text-base rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-purple-500 focus:border-purple-500 w-full transition-all"
                              value={searchStudent}
                              onChange={(e) => setSearchStudent(e.target.value)}
                          />
                      </div>
                  </div>
                  {/* ... rest of students view ... */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program / Year</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tickets</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedStudents.length > 0 ? (
                                    paginatedStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm border-2 border-white shadow-sm overflow-hidden">
                                                        {student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{student.name}</p>
                                                        <p className="text-xs text-slate-500">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{student.studentId || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{student.program || 'N/A'}</span>
                                                    <span className="text-xs text-slate-500">{student.yearLevel || 'N/A'} • Section {student.section || 'A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1">
                                                    {getStudentTickets(student.id).length} Records
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    size="sm"
                                                    onClick={() => setSelectedStudent(student)} 
                                                    className="bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 shadow-sm font-bold px-4"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" /> View History
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-10 w-10 text-slate-300 mb-2" />
                                                <p className="font-medium">No students found</p>
                                                <p className="text-xs mt-1">Try adjusting your search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>
                  {/* ... pagination ... */}
                  {totalStudentPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-8">
                          <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => setStudentPage(prev => Math.max(prev - 1, 1))}
                              disabled={studentPage === 1}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                              Previous
                          </Button>
                          <div className="flex items-center space-x-1">
                              {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((page) => (
                                  <button
                                      key={page}
                                      onClick={() => setStudentPage(page)}
                                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                          studentPage === page
                                              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                              : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
                                      }`}
                                  >
                                      {page}
                                  </button>
                              ))}
                          </div>
                          <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => setStudentPage(prev => Math.min(prev + 1, totalStudentPages))}
                              disabled={studentPage === totalStudentPages}
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                              Next
                          </Button>
                      </div>
                  )}
              </div>
          )}
          
          {view === 'settings' && (
              // ... Settings View ...
              <div className="max-w-5xl mx-auto space-y-10">
                {/* ... existing settings view content ... */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-slate-500 text-lg mt-2">Manage your profile information and security settings.</p>
                    </div>
                </div>
                {/* ... Profile Information Card ... */}
                <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
                    {/* ... content ... */}
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-900">Registrar Profile</CardTitle>
                                <p className="text-base text-slate-500 mt-1">Update your account's profile information.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleProfileUpdate}>
                            <div className="flex flex-col md:flex-row gap-10 mb-8">
                                <div className="flex flex-col items-center space-y-4 pt-2">
                                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('registrar-avatar-upload')?.click()}>
                                        <div className="h-40 w-40 rounded-full bg-purple-100 flex items-center justify-center text-5xl font-bold text-purple-600 border-4 border-white shadow-2xl overflow-hidden relative">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                profileData.name.charAt(0)
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            id="registrar-avatar-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium pointer-events-none">
                                            Change
                                        </div>
                                        <button type="button" className="absolute bottom-2 right-2 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors border-4 border-white">
                                            <Camera className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <Label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                                <Input 
                                                    value={profileData.name} 
                                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                                                    className="pl-12 py-6 text-base bg-slate-50 focus:bg-white border-slate-200 focus:ring-purple-500 focus:border-purple-500 rounded-xl" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                                <Input 
                                                    value={profileData.email} 
                                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                                                    className="pl-12 py-6 text-base bg-slate-50 focus:bg-white border-slate-200 focus:ring-purple-500 focus:border-purple-500 rounded-xl" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <Label htmlFor="department" className="mb-2 block text-sm font-bold text-slate-700">Department</Label>
                                            <div className="relative">
                                                <Building className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                                <Input 
                                                    value={profileData.department} 
                                                    onChange={(e) => setProfileData({...profileData, department: e.target.value})} 
                                                    className="pl-12 py-6 text-base bg-slate-50 focus:bg-white border-slate-200 focus:ring-purple-500 focus:border-purple-500 rounded-xl" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                                <Input 
                                                    value={profileData.phone} 
                                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                                                    className="pl-12 py-6 text-base bg-slate-50 focus:bg-white border-slate-200 focus:ring-purple-500 focus:border-purple-500 rounded-xl" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="bio" className="mb-2 block text-sm font-bold text-slate-700">Bio</Label>
                                        <textarea 
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                        />
                                        <p className="mt-2 text-sm text-slate-500">Brief description for your profile.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-base font-bold rounded-xl shadow-lg shadow-purple-200 transition-transform hover:-translate-y-1" disabled={isSaving}>
                                    {isSaving ? (
                                        <>Saving...</>
                                    ) : (
                                        <><Save className="h-5 w-5 mr-2" /> Save Changes</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                <Lock className="h-6 w-6" /> 
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-900">Security</CardTitle>
                                <p className="text-base text-slate-500 mt-1">Ensure your account is secure by setting a strong password.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handlePasswordUpdate} className="max-w-2xl">
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="currentPassword" className="mb-2 block text-sm font-bold">Current Password</Label>
                                    <div className="relative">
                                        <Input 
                                            id="currentPassword" 
                                            type={showCurrentPassword ? "text" : "password"} 
                                            value={passwords.current} 
                                            onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                                            required 
                                            className="py-6 text-base rounded-xl border-slate-200 focus:ring-purple-500 pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="newPassword" className="mb-2 block text-sm font-bold">New Password</Label>
                                        <div className="relative">
                                            <Input 
                                                id="newPassword" 
                                                type={showNewPassword ? "text" : "password"} 
                                                value={passwords.new} 
                                                onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                                                required 
                                                className="py-6 text-base rounded-xl border-slate-200 focus:ring-purple-500 pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold">Confirm Password</Label>
                                        <div className="relative">
                                            <Input 
                                                id="confirmPassword" 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                value={passwords.confirm} 
                                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                                                required 
                                                className="py-6 text-base rounded-xl border-slate-200 focus:ring-purple-500 pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 mt-4">
                                <Button type="submit" variant="outline" className="border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-base font-bold px-8 py-4 rounded-xl transition-colors" disabled={isSaving}>
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
              </div>
          )}

          {/* Ticket Detail Modal ... */}
          <Modal 
              isOpen={!!selectedTicket} 
              onClose={() => {
                setSelectedTicket(null);
                setAppointmentDate(''); // Clear appointment date when closing modal
                setCommentText(''); // Also clear comment text
                setCommentFile(null); // Clear comment file
              }}
              title={selectedTicket ? `Ticket #${selectedTicket.id}` : 'Ticket Details'}
              maxWidth="max-w-6xl"
          >
              {selectedTicket && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Main Content Column */}
                     <div className="lg:col-span-2 space-y-8">
                          {/* ... existing modal content ... */}
                          <div className="flex justify-between items-start">
                              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{selectedTicket.title}</h1>
                              <Badge 
                                 className="px-4 py-1.5 text-sm font-bold ml-4 rounded-lg whitespace-nowrap" 
                                 variant={selectedTicket.status === 'Resolved' ? 'success' : selectedTicket.status === 'In Progress' ? 'info' : 'warning'}
                              >
                                 {selectedTicket.status}
                              </Badge>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                                  <p className="text-base font-semibold text-slate-900">{selectedTicket.subcategory || 'General Request'}</p>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                                  <p className="text-base font-semibold text-slate-900">{selectedTicket.category}</p>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                                  <p className={`text-base font-semibold ${selectedTicket.priority === 'High' ? 'text-red-500' : 'text-slate-900'}`}>{selectedTicket.priority}</p>
                              </div>
                          </div>

                          {/* Description */}
                          <div>
                              <h3 className="text-sm font-bold text-slate-500 mb-3">Description</h3>
                              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {selectedTicket.description}
                              </div>
                          </div>

                          {/* Attachments */}
                          {selectedTicket.attachment && (
                              <div>
                                  <h3 className="text-sm font-bold text-slate-500 mb-3">Attachments (1)</h3>
                                  <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-white">
                                     <div className="flex items-center space-x-4">
                                         <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                             <FileText className="h-6 w-6" />
                                         </div>
                                         <div>
                                             <p className="text-sm font-bold text-slate-900">{selectedTicket.attachment.name}</p>
                                             <p className="text-xs text-slate-500 font-mono uppercase">{(selectedTicket.attachment.type && selectedTicket.attachment.type.split('/')[1]) || 'FILE'}</p>
                                         </div>
                                     </div>
                                     <a 
                                         href={selectedTicket.attachment.url} 
                                         download={selectedTicket.attachment.name}
                                         className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center"
                                     >
                                         <Download className="h-4 w-4 mr-1" /> Download
                                     </a>
                                 </div>
                              </div>
                          )}
                          
                          {/* ... rest of the modal ... */}
                          {/* Communication */}
                          <div className="pt-4">
                              <div className="flex items-center space-x-2 mb-4">
                                  <MessageSquare className="h-5 w-5 text-slate-400" />
                                  <h3 className="text-lg font-bold text-slate-900">Communication</h3>
                                  <Badge className="bg-slate-100 text-slate-600 rounded-full px-2">{(selectedTicket.comments || []).length}</Badge>
                              </div>

                              <div className="space-y-6 mb-6">
                                 {(selectedTicket.comments || []).map((comment) => (
                                     <div key={comment.id} className={`flex ${comment.role === 'Student' ? 'justify-end' : 'justify-start'}`}>
                                         <div className={`flex gap-3 max-w-[80%] ${comment.role === 'Student' ? 'flex-row-reverse' : 'flex-row'}`}>
                                             <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${comment.role === 'Student' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                                 {(comment.authorName || 'U').charAt(0)}
                                             </div>
                                             <div>
                                                 <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                     comment.role === 'Student' 
                                                     ? 'bg-indigo-50 text-slate-800 rounded-tr-none' 
                                                     : 'bg-purple-50 text-slate-800 rounded-tl-none border border-purple-100'
                                                 }`}>
                                                     <p className="font-bold text-xs mb-1 opacity-70">{comment.authorName || 'Unknown'} <span className="font-normal opacity-75">• {comment.role || 'User'}</span></p>
                                                     {comment.text || 'No message'}
                                                     {/* Render Comment Attachment */}
                                                     {comment.attachment && (
                                                        <div className="mt-3 pt-2 border-t border-black/5">
                                                            {comment.attachment.type && comment.attachment.type.startsWith('image/') ? (
                                                                <div className="mt-2 group relative">
                                                                     <img 
                                                                        src={comment.attachment.url} 
                                                                        alt="Attachment" 
                                                                        className="rounded-lg max-h-48 w-auto object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity bg-white"
                                                                        onClick={() => setPreviewImage(comment.attachment.url)}
                                                                     />
                                                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                                                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Click to view</div>
                                                                     </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-white/50 p-2 rounded-lg border border-slate-200/50 flex items-center gap-2 max-w-fit mt-1">
                                                                    <Paperclip className="h-4 w-4 text-black flex-shrink-0" />
                                                                    <a href={comment.attachment.url} download={comment.attachment.name} className="text-xs font-bold text-slate-900 hover:underline hover:text-purple-600 truncate max-w-[200px]">
                                                                        {comment.attachment.name}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                     )}
                                                 </div>
                                                 <p className={`text-[10px] text-slate-400 mt-1 ${comment.role === 'Student' ? 'text-right' : 'text-left'}`}>{comment.timestamp || 'Just now'}</p>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <textarea 
                                     className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px] mb-3"
                                     placeholder="Type your reply here..."
                                     value={commentText}
                                     onChange={(e) => setCommentText(e.target.value)}
                                  />
                                  <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                         <label className="cursor-pointer p-2 text-slate-900 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 rounded-full transition-colors" title="Attach file">
                                            <Paperclip className="h-4 w-4 text-black" />
                                            <input type="file" className="hidden" onChange={(e) => e.target.files && setCommentFile(e.target.files[0])} />
                                         </label>
                                         {commentFile && (
                                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 ml-2">
                                                <span className="text-xs font-medium text-purple-700 max-w-[150px] truncate">{commentFile.name}</span>
                                                <button onClick={() => setCommentFile(null)} className="text-purple-500 hover:text-red-500">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                         )}
                                      </div>
                                      <Button 
                                         onClick={handlePostComment}
                                         disabled={!commentText.trim() && !commentFile}
                                         className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg"
                                      >
                                          <Send className="h-4 w-4 mr-2" /> Send Reply
                                      </Button>
                                  </div>
                              </div>
                          </div>
                     </div>

                     {/* Right Sidebar */}
                     <div className="space-y-6">
                         {/* Manage Ticket (Status & Priority) */}
                         <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                             <CardHeader className="bg-white border-b border-slate-50 p-4">
                                 <CardTitle className="text-sm font-bold text-slate-900">Manage Ticket</CardTitle>
                             </CardHeader>
                             <CardContent className="p-4 space-y-4">
                                 <div>
                                     <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Status</Label>
                                     <Select
                                         value={selectedTicket.status}
                                         onChange={(e) => handleStatusUpdate(e.target.value)}
                                         className="w-full bg-slate-50 border-slate-200 font-medium text-slate-700 rounded-lg focus:ring-purple-500"
                                     >
                                         <option value="Pending">Pending</option>
                                         <option value="In Progress">In Progress</option>
                                         <option value="Resolved">Resolved</option>
                                     </Select>
                                 </div>
                                 <div>
                                     <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Priority</Label>
                                     <Select
                                         value={selectedTicket.priority}
                                         onChange={(e) => handlePriorityUpdate(e.target.value)}
                                         className="w-full bg-slate-50 border-slate-200 font-medium text-slate-700 rounded-lg focus:ring-purple-500"
                                     >
                                         <option value="Low">Low</option>
                                         <option value="Medium">Medium</option>
                                         <option value="High">High</option>
                                     </Select>
                                 </div>
                             </CardContent>
                         </Card>
                         
                         {/* ... Appointment Card ... */}
                         <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                             <CardHeader className="bg-white border-b border-slate-50 p-4">
                                 <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                                     <Clock className="h-4 w-4 mr-2 text-purple-600" />
                                     Appointment Schedule
                                 </CardTitle>
                             </CardHeader>
                             <CardContent className="p-4">
                                 <form onSubmit={handleSetAppointment} className="space-y-4">
                                     <div>
                                         <Label htmlFor="date" className="text-xs font-bold text-slate-500 mb-1.5 block">Date</Label>
                                         <Input 
                                             type="date" 
                                             id="date"
                                             value={appointmentDate}
                                             onChange={(e) => setAppointmentDate(e.target.value)}
                                             className="w-full text-sm py-2"
                                             style={{ colorScheme: 'light' }}
                                         />
                                     </div>
                                     <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2">
                                         Set Appointment
                                     </Button>
                                 </form>
                             </CardContent>
                         </Card>

                         {/* Request Information */}
                         <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                             <CardHeader className="bg-white border-b border-slate-50 p-4">
                                 <CardTitle className="text-sm font-bold text-slate-900">Request Information</CardTitle>
                             </CardHeader>
                             <CardContent className="p-4 space-y-4">
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm text-slate-500">Request ID</span>
                                     <span className="text-sm font-mono font-medium text-slate-900">{selectedTicket.id}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm text-slate-500">Priority</span>
                                     <span className={`text-sm font-bold ${selectedTicket.priority === 'High' ? 'text-red-500' : 'text-slate-900'}`}>{selectedTicket.priority}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm text-slate-500">Student</span>
                                     <span className="text-sm font-medium text-slate-900 text-right truncate max-w-[150px]">{selectedTicket.studentName}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm text-slate-500">Submitted</span>
                                     <span className="text-sm font-medium text-slate-900">{selectedTicket.submittedDate}</span>
                                 </div>
                             </CardContent>
                         </Card>

                         {/* Important Note */}
                         <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
                             <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                             <div>
                                 <h4 className="text-sm font-bold text-purple-900 mb-1">Important</h4>
                                 <p className="text-xs text-purple-700 leading-relaxed">
                                     Update the status to keep students informed about their request progress. Always verify documents before resolving.
                                 </p>
                             </div>
                         </div>
                     </div>
                 </div>
              )}
          </Modal>

        {/* Student History Modal ... */}
         <Modal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            title=""
            maxWidth="max-w-4xl"
        >
            {selectedStudent && (
                <div className="space-y-6">
                    <div className="flex items-center space-x-6 mb-8 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl border-2 border-white/30 overflow-hidden relative z-10">
                            {selectedStudent.avatar ? (
                                <img src={selectedStudent.avatar} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                selectedStudent.name.charAt(0)
                            )}
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-2xl text-white">{selectedStudent.name}</h3>
                            <p className="text-purple-100 opacity-90">{selectedStudent.email}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">{selectedStudent.studentId || 'No ID'}</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">{selectedStudent.program || 'General'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Ticket History Section - Always Visible */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xl text-slate-900">Ticket History</h4>
                            <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                                {getStudentTickets(selectedStudent.id).length} Total
                            </Badge>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {getStudentTickets(selectedStudent.id).length > 0 ? (
                            getStudentTickets(selectedStudent.id).map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setSelectedTicket(t);
                                    }}
                                    className="border border-slate-200 rounded-xl p-5 hover:bg-slate-50 transition-all group bg-white cursor-pointer hover:border-purple-400 hover:shadow-md relative"
                                >
                                    <div className="flex justify-between items-start pr-8">
                                        <div>
                                            <span className="text-xs font-mono text-slate-400 block mb-1">{t.id}</span>
                                            <h5 className="font-bold text-lg text-slate-900 group-hover:text-purple-600 transition-colors">{t.title}</h5>
                                            <p className="text-sm text-slate-600 mt-1 font-medium">{t.category}</p>
                                            {t.subcategory && <p className="text-xs text-emerald-600 mt-1 font-medium">{t.subcategory}</p>}
                                        </div>
                                        <Badge className="px-3 py-1 text-xs" variant={t.status === 'Resolved' ? 'success' : t.status === 'In Progress' ? 'info' : 'warning'}>
                                            {t.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400 flex justify-between items-center">
                                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1"/> {t.submittedDate}</span>
                                        <span className="flex items-center gap-1">Priority: <span className={`font-bold uppercase ${t.priority === 'High' ? 'text-red-500' : 'text-slate-500'}`}>{t.priority}</span></span>
                                    </div>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all">
                                        <ChevronRight className="h-6 w-6" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No registrar tickets found for this student.</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
        </Modal>

        {/* Lightbox */}
        <AnimatePresence>
            {previewImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <motion.img 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        src={previewImage} 
                        alt="Preview" 
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
                        onClick={(e: any) => e.stopPropagation()} 
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};
