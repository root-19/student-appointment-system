import React, { useState, useEffect } from 'react';

import { motion as m, AnimatePresence } from 'framer-motion';

import { Home, Ticket, Settings, Plus, Bell, Calendar, Menu, X, LogOut, Search, Filter, User, Lock, Save, Camera, MessageSquare, Send, Clock, AlertCircle, CheckCircle, ChevronRight, HelpCircle, Download, Upload, Paperclip, Trash2, Eye, EyeOff, Printer, FileText, Info, ArrowUpDown } from 'lucide-react';

import { DashboardProps, Priority, TicketCategory, Ticket as TicketType } from '../types';

import { useData } from '../context/DataContext';

import { ticketAPI } from '../services/api';

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Modal, Select, Toast } from './UIComponents';

// Cast motion to any to avoid TypeScript errors with initial/animate props in this environment

const motion = m as any;



// Subcategory Data Structure

const CATEGORY_OPTIONS: Record<TicketCategory, string[]> = {

    'Registrar': [

      'Grade Correction',

      'Enrollment Issues',

      'Add/Drop Subjects',

      'Transcript of Records (TOR)',

      'Certifications',

      'Transfer Credits',

      'Other'

    ],

    'Administrative': [

      'Student ID Replacement',

      'Payment Slips / Receipts',

      'School Maintenance Requests',

      'Facilities Concerns',

      'Cleanliness Issues',

      'Lost and Found',

      'Campus Access / Gate Pass',

      'Building Pass or Room Access',

      'Parking / Transportation',

      'Event Requests / Venue Reservation',

      'Other Administrative'

    ],

    'Academic': [

      'Grades Inquiry / Clarification',

      'Class Schedule Issues',

      'Course Requirements / Syllabus Concerns',

      'Examination Concerns',

      'Academic Advising / Consultation',

      'Attendance Concerns',

      'Instructor Concerns',

      'Subject / Class Enrollment Clarification',

      'Learning Materials Requests',

      'Other Academic Concerns'

    ]

};



export const StudentDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {

  const { tickets, documents, notifications, addTicket, addComment, markNotificationAsRead, clearAllNotifications, updateUser } = useData();

  const [view, setView] = useState<'home' | 'tickets' | 'appointments' | 'settings'>('home');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);



  // Ticket View/Reply State

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const [commentText, setCommentText] = useState('');

  const [commentFile, setCommentFile] = useState<File | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);



  // Filtering State

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const [sortOption, setSortOption] = useState<'Newest' | 'LastUpdated'>('Newest');

  

  // Pagination State

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5; 



  // Toast Notification

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);



  // Filter tickets for current student

  // Ensure matching even if backend sends numeric IDs

  const myTickets = tickets.filter(t => String(t.submittedBy) === String(user.id));

  const pendingCount = myTickets.filter(t => t.status === 'Pending').length;

  const resolvedCount = myTickets.filter(t => t.status === 'Resolved').length;



  // Filter appointments - ensure value is present and looks like a date

  const myAppointments = myTickets.filter(t => {

    if (!t.appointmentDate) return false;

    const dateStr = String(t.appointmentDate).trim();

    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return false;

    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

  });



  // Filter notifications for current student - ensure ID matching

  const myNotifications = notifications.filter(n => String(n.recipientId) === String(user.id)).sort((a, b) => {

    const dateA = new Date(a.timestamp).getTime();

    const dateB = new Date(b.timestamp).getTime();

    return dateB - dateA;

  });

  const unreadNotificationsCount = myNotifications.filter(n => !n.isRead).length;



  // Apply filters and sorting to tickets

  const filteredTickets = myTickets.filter(ticket => {

    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 

                          ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;

    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;

    

    return matchesSearch && matchesStatus && matchesCategory;

  }).sort((a, b) => {

    const getDate = (dateStr: string) => {

        if (!dateStr) return 0;

        const d = new Date(dateStr);

        return isNaN(d.getTime()) ? 0 : d.getTime();

    };

    const dateA = sortOption === 'Newest' ? getDate(a.submittedDate) : getDate(a.lastUpdated);

    const dateB = sortOption === 'Newest' ? getDate(b.submittedDate) : getDate(b.lastUpdated);

    return (dateB - dateA) || b.id.localeCompare(a.id);

  });



  // Reset pagination when filters change

  useEffect(() => {

    setCurrentPage(1);

  }, [searchQuery, statusFilter, categoryFilter, sortOption]);



  // Calculate pagination

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);

  const paginatedTickets = filteredTickets.slice(

    (currentPage - 1) * ITEMS_PER_PAGE,

    currentPage * ITEMS_PER_PAGE

  );



  // Form State

  const [newTicket, setNewTicket] = useState({

    title: '',

    category: 'Registrar' as TicketCategory,

    subcategory: CATEGORY_OPTIONS['Registrar'][0],

    priority: 'Low' as Priority,

    description: ''

  });

  const [ticketFile, setTicketFile] = useState<File | null>(null);



  // Settings State

  const [profileData, setProfileData] = useState({

    name: user.name,

    email: user.email,

    studentId: user.studentId || '2024-0001',

    program: user.program || 'BSIT',

    yearLevel: user.yearLevel || '1st Year'

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



  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

      const selectedCategory = e.target.value as TicketCategory;

      setNewTicket({

          ...newTicket,

          category: selectedCategory,

          subcategory: CATEGORY_OPTIONS[selectedCategory][0] // Reset subcategory to first option of new category

      });

  };



  const handleSubmitTicket = (e: React.FormEvent) => {

    e.preventDefault();

    addTicket({

      title: newTicket.title,

      category: newTicket.category,

      subcategory: newTicket.subcategory,

      priority: newTicket.priority,

      description: newTicket.description,

      attachment: ticketFile

    });

    setIsNewTicketModalOpen(false);

    // Reset form

    setNewTicket({ 

        title: '', 

        category: 'Registrar', 

        subcategory: CATEGORY_OPTIONS['Registrar'][0], 

        priority: 'Low', 

        description: '' 

    });

    setTicketFile(null);

    setView('tickets'); // Switch to tickets view to see the new ticket

    // Reset filters to show new ticket

    setStatusFilter('All');

    setCategoryFilter('All');

    setSearchQuery('');

    setToast({ message: "Ticket submitted successfully.", type: 'success' });

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

          comments: [...(selectedTicket.comments || []), newComment]

      });

      setCommentText('');

      setCommentFile(null);

  };



  const handleNotificationClick = (notification: any) => {

      markNotificationAsRead(notification.id);

      if (notification.ticketId) {

          const ticket = tickets.find(t => t.id === notification.ticketId);

          if (ticket) {

              setSelectedTicket(ticket);

              setView('tickets');

          }

      }

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



  const handlePrintSlip = (ticket: TicketType | null = selectedTicket) => {

    if (!ticket) return;



    // Generate reference code: REF-{TicketID}-{Random}

    const refCode = `REF-${ticket.id.split('-')[1]}-${Math.floor(1000 + Math.random() * 9000)}`;

    let location = 'Admin Office';

    let assignedStaff = 'Admin Staff';

    

    if (ticket.category === 'Registrar') {

        location = 'Registrar Office';

        assignedStaff = 'Maria Santos';

    } else if (ticket.category === 'Academic') {

        location = 'Academic Affairs';

        assignedStaff = 'Academic Staff';

    } else if (ticket.category === 'Administrative') {

        location = 'Student Affairs';

        assignedStaff = 'Admin Staff';

    }



    const printWindow = window.open('', '', 'width=800,height=800');

    if (printWindow) {

        printWindow.document.write(`

            <html>

                <head>

                    <title>Appointment Slip - ${ticket.id}</title>

                    <style>

                        body { font-family: 'Courier New', Courier, monospace; padding: 40px; background-color: #f3f4f6; }

                        .container { 

                            background-color: white; 

                            border: 2px solid #1f2937; 

                            max-width: 600px; 

                            margin: 0 auto; 

                            padding: 0;

                            box-shadow: 8px 8px 0px rgba(0,0,0,0.1);

                        }

                        .header { 

                            background-color: #1f2937;

                            color: white;

                            text-align: center; 

                            padding: 25px;

                            border-bottom: 2px solid #000;

                        }

                        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; }

                        .header h2 { margin: 5px 0 0; font-size: 14px; font-weight: normal; opacity: 0.8; }

                        

                        .content { padding: 40px; }

                        

                        .row { 

                            display: flex; 

                            justify-content: space-between; 

                            margin-bottom: 15px; 

                            border-bottom: 1px dashed #e5e7eb; 

                            padding-bottom: 8px;

                        }

                        .row:last-child { border-bottom: none; }

                        

                        .label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 13px; width: 160px; }

                        .value { font-weight: bold; text-align: right; color: #111827; flex: 1; font-size: 15px; }

                        

                        .appointment-box { 

                            background-color: #ecfdf5; 

                            border: 2px solid #10b981; 

                            padding: 20px; 

                            border-radius: 8px; 

                            margin: 30px 0; 

                            text-align: center; 

                        }

                        .box-label { font-size: 12px; text-transform: uppercase; color: #059669; letter-spacing: 1px; font-weight: bold; margin-bottom: 5px; }

                        .date { font-size: 24px; font-weight: bold; color: #064e3b; margin-bottom: 5px; }

                        

                        .section-title {

                            font-size: 16px;

                            font-weight: bold;

                            border-bottom: 2px solid #1f2937;

                            padding-bottom: 5px;

                            margin-bottom: 15px;

                            margin-top: 20px;

                            color: #1f2937;

                        }



                        .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }

                        

                        @media print {

                            body { background-color: white; padding: 0; }

                            .container { box-shadow: none; border: 2px solid black; }

                        }

                    </style>

                </head>

                <body>

                    <div class="container">

                        <div class="header">

                            <h1>Appointment Slip</h1>

                            <h2>Pateros Technological College</h2>

                        </div>

                        <div class="content">

                            

                            <div class="row">

                                <span class="label">Student Name:</span>

                                <span class="value">${ticket.studentName}</span>

                            </div>

                            <div class="row">

                                <span class="label">Student ID:</span>

                                <span class="value">${user.studentId || 'N/A'}</span>

                            </div>



                            <div class="appointment-box">

                                <div class="box-label">Scheduled Appointment</div>

                                <div class="date">${ticket.appointmentDate}</div>

                            </div>



                            <div class="section-title">Ticket Details</div>

                            

                            <div class="row">

                                <span class="label">Ticket ID:</span>

                                <span class="value">${ticket.id}</span>

                            </div>

                            <div class="row">

                                <span class="label">Concern Category:</span>

                                <span class="value">${ticket.category}</span>

                            </div>

                            <div class="row">

                                <span class="label">Sub-Category:</span>

                                <span class="value">${ticket.subcategory || 'General'}</span>

                            </div>



                            <div class="section-title">Location & Staff</div>



                            <div class="row">

                                <span class="label">Location:</span>

                                <span class="value">${location}</span>

                            </div>

                            <div class="row">

                                <span class="label">Assigned Staff:</span>

                                <span class="value">${assignedStaff}</span>

                            </div>

                            <div class="row">

                                <span class="label">Reference Code:</span>

                                <span class="value" style="font-family: monospace; letter-spacing: 1px;">${refCode}</span>

                            </div>

                        </div>

                        <div class="footer">

                            <p>Please present this slip or a digital copy to the security officer or staff upon arrival.</p>

                            <p>Generated: ${new Date().toLocaleString()}</p>

                        </div>

                    </div>

                    <script>

                        setTimeout(() => { window.print(); }, 500);

                    </script>

                </body>

            </html>

        `);

        printWindow.document.close();

    }

  };



  return (

    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Toast Notification */}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}



      {/* Mobile Menu Overlay */}

      {isMobileMenuOpen && (

        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />

      )}



      {/* Left Sidebar Navigation */}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col h-full transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-8 flex items-center justify-between border-b border-slate-50">

           <div className="flex items-center space-x-4">

              <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">

                <img
                  src="/assets/logo.png"
                  alt="PTC Logo"
                  className="h-8 w-8 object-contain"
                />

              </div>

              <div>

                <span className="font-bold text-xl text-slate-900 block leading-none">Student</span>

                <span className="text-xs text-emerald-600 font-bold tracking-widest mt-1 block">PORTAL</span>

              </div>

           </div>

           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-slate-700">

             <X className="h-6 w-6" />

           </button>

        </div>



        {/* User Profile Card */}

        <div className="px-6 pt-8 mb-4">

            <div className="p-5 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm">

                <div className="flex items-center space-x-3 mb-3">

                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white overflow-hidden">

                        {user.avatar ? (

                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />

                        ) : (

                            user.name.charAt(0)

                        )}

                    </div>

                    <div className="overflow-hidden">

                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">

                            <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>

                            Online

                        </p>

                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>

                    </div>

                </div>

                <p className="text-xs text-slate-500 truncate pl-1 opacity-80">{user.email}</p>

            </div>

        </div>

        

        {/* Navigation */}

        <nav className="flex-1 px-6 space-y-3 mt-4">

           {[

             { id: 'home', label: 'Dashboard', icon: Home },

             { id: 'tickets', label: 'My Tickets', icon: Ticket },

             { id: 'appointments', label: 'Appointment Slips', icon: Calendar },

             { id: 'settings', label: 'Settings', icon: Settings },

           ].map((item) => (

             <button

               key={item.id}

               onClick={() => {

                 setView(item.id as any);

                 setIsMobileMenuOpen(false);

                 setSelectedTicket(null);

               }}

               className={`flex items-center w-full px-5 py-3.5 text-base font-medium rounded-2xl transition-all duration-200 group ${

                 view === item.id 

                   ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 translate-x-1' 

                   : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'

               }`}

             >

               <item.icon className={`mr-4 h-5 w-5 ${view === item.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />

               {item.label}

             </button>

           ))}

        </nav>



        {/* Logout */}

        <div className="p-6 border-t border-slate-100">

            <Button 

                variant="outline"

                className="w-full py-6 text-base border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors rounded-2xl font-semibold" 

                onClick={onLogout}

            >

                <LogOut className="mr-3 h-5 w-5" />

                Sign Out

            </Button>

        </div>

      </aside>



      {/* Main Content Area */}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">

        {/* Header */}

        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-4 sm:px-8 lg:px-10 sticky top-0 z-30">

            <div className="flex items-center">

                <button onClick={() => setIsMobileMenuOpen(true)} className="mr-4 md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">

                    <Menu className="h-6 w-6" />

                </button>

                <h2 className="text-xl font-bold text-slate-800 tracking-tight">

                    {view === 'home' ? 'Overview' : view === 'tickets' ? 'My Tickets' : view === 'appointments' ? 'Appointment Slips' : view.charAt(0).toUpperCase() + view.slice(1)}

                </h2>

            </div>

            <div className="flex items-center space-x-6">

                <div className="relative group">

                    <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50">

                        <Bell className="h-6 w-6" />

                        {unreadNotificationsCount > 0 && (

                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>

                        )}

                    </button>

                </div>

            </div>

        </header>



        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 scroll-smooth">

            <div className="max-w-7xl mx-auto">

                

                {view === 'settings' ? (

                    // ... Settings View ...

                    <div className="max-w-4xl mx-auto space-y-10 pb-10">

                        <div className="flex items-center justify-between">

                            <div>

                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>

                                <p className="text-slate-500 mt-2">Manage your profile information and security settings.</p>

                            </div>

                        </div>



                        {/* Profile Information */}

                        <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl bg-white">

                            <CardHeader className="bg-white border-b border-slate-100 p-8">

                                <div className="flex items-center space-x-4">

                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">

                                        <User className="h-6 w-6" />

                                    </div>

                                    <div>

                                        <CardTitle className="text-xl font-bold text-slate-900">Profile Information</CardTitle>

                                        <p className="text-sm text-slate-500 mt-1">Your academic and personal details.</p>

                                    </div>

                                </div>

                            </CardHeader>

                            <CardContent className="p-8">

                                <div>

                                    <div className="flex flex-col md:flex-row gap-10">

                                        <div className="flex flex-col items-center space-y-4 pt-2">

                                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>

                                                <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 border-4 border-white shadow-lg overflow-hidden relative">

                                                    {user.avatar ? (

                                                        <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />

                                                    ) : (

                                                        <span>{profileData.name.charAt(0)}</span>

                                                    )}

                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">

                                                        <Camera className="h-8 w-8 text-white" />

                                                    </div>

                                                </div>

                                                <input 

                                                    type="file" 

                                                    id="avatar-upload" 

                                                    className="hidden" 

                                                    accept="image/*"

                                                    onChange={handleAvatarChange}

                                                />

                                            </div>

                                            <p className="text-xs text-slate-500">Click to change photo</p>

                                        </div>

                                        

                                        <div className="flex-1 space-y-6">

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                <div>

                                                    <Label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">Full Name</Label>

                                                    <Input 

                                                        id="name" 

                                                        value={profileData.name} 

                                                        readOnly

                                                        className="py-3 text-sm bg-slate-50 border-slate-200 text-slate-600 rounded-xl cursor-not-allowed" 

                                                    />

                                                </div>

                                                <div>

                                                    <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email Address</Label>

                                                    <Input 

                                                        id="email" 

                                                        value={profileData.email} 

                                                        readOnly

                                                        className="py-3 text-sm bg-slate-50 border-slate-200 text-slate-600 rounded-xl cursor-not-allowed" 

                                                    />

                                                </div>

                                            </div>



                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                                <div>

                                                    <Label htmlFor="studentId" className="mb-2 block text-sm font-bold text-slate-700">Student ID</Label>

                                                    <Input 

                                                        id="studentId" 

                                                        value={profileData.studentId} 

                                                        readOnly

                                                        className="py-3 text-sm bg-slate-50 border-slate-200 text-slate-600 rounded-xl cursor-not-allowed" 

                                                    />

                                                </div>

                                                <div>

                                                    <Label htmlFor="program" className="mb-2 block text-sm font-bold text-slate-700">Program</Label>

                                                    <Input 

                                                        id="program" 

                                                        value={profileData.program} 

                                                        readOnly

                                                        className="py-3 text-sm bg-slate-50 border-slate-200 text-slate-600 rounded-xl cursor-not-allowed" 

                                                    />

                                                </div>

                                                <div>

                                                    <Label htmlFor="yearLevel" className="mb-2 block text-sm font-bold text-slate-700">Year Level</Label>

                                                    <Input 

                                                        id="yearLevel" 

                                                        value={profileData.yearLevel} 

                                                        readOnly

                                                        className="py-3 text-sm bg-slate-50 border-slate-200 text-slate-600 rounded-xl cursor-not-allowed" 

                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </CardContent>

                        </Card>



                        {/* Security Settings */}

                        <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl bg-white">

                            <CardHeader className="bg-white border-b border-slate-100 p-8">

                                <div className="flex items-center space-x-4">

                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">

                                        <Lock className="h-6 w-6" />

                                    </div>

                                    <div>

                                        <CardTitle className="text-xl font-bold text-slate-900">Security</CardTitle>

                                        <p className="text-sm text-slate-500 mt-1">Update your password.</p>

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

                                                    className="py-3 text-sm rounded-xl border-slate-200 focus:ring-emerald-500 pr-10"

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

                                                        className="py-3 text-sm rounded-xl border-slate-200 focus:ring-emerald-500 pr-10"

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

                                                        className="py-3 text-sm rounded-xl border-slate-200 focus:ring-emerald-500 pr-10"

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

                                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5" disabled={isSaving}>

                                            Update Password

                                        </Button>

                                    </div>

                                </form>

                            </CardContent>

                        </Card>

                    </div>

                ) : view === 'tickets' ? (

                    // ... Tickets View ...

                    <div className="max-w-6xl mx-auto space-y-8 pb-10">

                         <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">

                           <div>

                               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Tickets</h1>

                               <p className="text-slate-500 text-lg mt-2">View and manage your support history.</p>

                           </div>

                           <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">

                              <div className="relative flex-1 sm:flex-none">

                                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                                  <Input 

                                    className="pl-12 w-full sm:w-64 bg-white h-12 rounded-xl border-slate-200 shadow-sm focus:ring-emerald-500" 

                                    placeholder="Search tickets..." 

                                    value={searchQuery}

                                    onChange={(e) => setSearchQuery(e.target.value)}

                                  />

                              </div>

                              <div className="flex space-x-3 w-full sm:w-auto">

                                <Select 

                                    value={sortOption}

                                    onChange={(e) => setSortOption(e.target.value as any)}

                                    className="w-full sm:w-40 bg-white h-12 rounded-xl border-slate-200 shadow-sm focus:ring-emerald-500"

                                >

                                    <option value="Newest">Date Submitted</option>

                                    <option value="LastUpdated">Last Updated</option>

                                </Select>

                                <Select 

                                    value={categoryFilter} 

                                    onChange={(e) => setCategoryFilter(e.target.value)}

                                    className="w-full sm:w-40 bg-white h-12 rounded-xl border-slate-200 shadow-sm focus:ring-emerald-500"

                                >

                                    <option value="All">All Categories</option>

                                    <option value="Registrar">Registrar</option>

                                    <option value="Administrative">Administrative</option>

                                    <option value="Academic">Academic</option>

                                </Select>

                                <Select 

                                    value={statusFilter} 

                                    onChange={(e) => setStatusFilter(e.target.value)}

                                    className="w-full sm:w-36 bg-white h-12 rounded-xl border-slate-200 shadow-sm focus:ring-emerald-500"

                                >

                                    <option value="All">All Status</option>

                                    <option value="Pending">Pending</option>

                                    <option value="In Progress">In Progress</option>

                                    <option value="Resolved">Resolved</option>

                                </Select>

                              </div>

                           </div>

                        </div>

                        <div className="grid gap-4">

                            {paginatedTickets.map((ticket) => (

                                <div key={ticket.id} className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-300 cursor-pointer" onClick={() => {

                                    console.log('Ticket clicked:', ticket);

                                    setSelectedTicket(ticket);

                                }}>

                                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">

                                        <div className="space-y-2">

                                            <div className="flex items-center flex-wrap gap-2">

                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{ticket.id}</span>

                                                <h3 className="font-medium text-slate-900 text-base group-hover:text-emerald-700 transition-colors">{ticket.title}</h3>

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

                                                <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5" /> {ticket.submittedDate}</span>

                                                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-100">{ticket.category}</span>

                                                {ticket.subcategory && (

                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">{ticket.subcategory}</span>

                                                )}

                                            </div>

                                        </div>

                                        <div className="flex items-center justify-end gap-3">

                                            <Badge className="px-3 py-1 text-xs font-medium" variant={ticket.status === 'Resolved' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'warning'}>

                                                {ticket.status}

                                            </Badge>

                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />

                                        </div>

                                    </div>

                                </div>

                            ))}

                            {filteredTickets.length === 0 && (

                                <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200 border-dashed">

                                    <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />

                                    <h3 className="text-lg font-bold text-slate-900">No matching tickets</h3>

                                    <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>

                                </div>

                            )}

                        </div>



                        {/* Pagination Controls */}

                        {totalPages > 1 && (

                            <div className="flex justify-center items-center space-x-2 mt-8">

                                <Button 

                                    variant="outline"

                                    size="sm" 

                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}

                                    disabled={currentPage === 1}

                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"

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

                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'

                                                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'

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

                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"

                                >

                                    Next

                                </Button>

                            </div>

                        )}

                    </div>

                ) : view === 'appointments' ? (

                    // ... Appointments View ...

                    <div className="max-w-6xl mx-auto space-y-8 pb-10">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                            <div>

                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointment Slips</h1>

                                <p className="text-slate-500 text-lg mt-2">View and print your scheduled appointments.</p>

                            </div>

                        </div>



                        {myAppointments.length > 0 ? (

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                {myAppointments.map((ticket) => (

                                    <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden border-l-4 border-l-emerald-500">

                                        <div className="flex justify-between items-start mb-4">

                                            <div className="flex flex-col">

                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</span>

                                                <span className="text-xl font-bold text-emerald-700">{ticket.appointmentDate}</span>

                                            </div>

                                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">

                                                <Calendar className="h-6 w-6" />

                                            </div>

                                        </div>

                                        

                                        <div className="space-y-3 mb-6">

                                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">

                                                <span className="text-sm text-slate-500">Ticket ID</span>

                                                <span className="text-sm font-mono text-slate-600">{ticket.id}</span>

                                            </div>

                                            <div className="flex justify-between items-center">

                                                <span className="text-sm text-slate-500">Office</span>

                                                <span className="text-sm font-medium text-slate-900">{ticket.category}</span>

                                            </div>

                                        </div>



                                        <div className="bg-slate-50 p-3 rounded-lg mb-6">

                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Subject</p>

                                            <p className="text-sm font-medium text-slate-800 line-clamp-1">{ticket.title}</p>

                                        </div>



                                        <Button 

                                            onClick={() => handlePrintSlip(ticket)}

                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200"

                                        >

                                            <Printer className="mr-2 h-4 w-4" /> Print Slip

                                        </Button>

                                    </div>

                                ))}

                            </div>

                        ) : (

                             <div className="flex flex-col items-center justify-center h-96 text-center space-y-6 bg-white rounded-2xl border border-slate-200 border-dashed">

                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">

                                    <Calendar className="h-10 w-10 text-slate-400" />

                                </div>

                                <div className="max-w-xs mx-auto">

                                    <h3 className="text-xl font-bold text-slate-900">No appointments yet</h3>

                                    <p className="text-slate-500 mt-2">When a staff member sets an appointment for your ticket, it will appear here.</p>

                                </div>

                             </div>

                        )}

                    </div>

                ) : (

                    // Default layout for Home view (with Sidebar)

                    <div className="flex flex-col lg:flex-row gap-8 pb-10">

                         {/* ... Home View Content ... */}

                        {/* Center Content */}

                        <div className="flex-1 space-y-8">

                            {view === 'home' && (

                                <>

                                    {/* Welcome Banner */}

                                    <div className="bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl p-8 text-white shadow-lg shadow-emerald-200/50 relative overflow-hidden mb-8">

                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                                        

                                        <div className="relative z-10">

                                            <p className="text-emerald-50 font-medium mb-2 text-sm">

                                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

                                            </p>

                                            <h1 className="text-4xl font-bold mb-3 tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>

                                            <p className="text-emerald-50 text-lg mb-8 opacity-90">Always stay updated in your student portal</p>

                                            

                                            <button 

                                                onClick={() => setIsNewTicketModalOpen(true)}

                                                className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"

                                            >

                                                <Plus className="h-5 w-5" />

                                                Create New Ticket

                                            </button>

                                        </div>

                                    </div>

                                    {/* Stats Grid */}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                        {/* Total Tickets */}

                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">

                                            <div className="flex justify-between items-start mb-4">

                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">

                                                    <Ticket className="h-6 w-6" />

                                                </div>

                                                <span className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">

                                                    All Time

                                                </span>

                                            </div>

                                            <h3 className="text-4xl font-bold text-slate-900 mb-1">{myTickets.length}</h3>

                                            <p className="text-sm font-bold text-slate-500">Total Tickets</p>

                                        </div>



                                        {/* Pending - Highlighted */}

                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">

                                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-50"></div>

                                            <div className="relative z-10">

                                                <div className="flex justify-between items-start mb-4">

                                                    <div className="p-3 bg-white text-amber-600 rounded-xl shadow-sm">

                                                        <Clock className="h-6 w-6" />

                                                    </div>

                                                    {pendingCount > 0 && (

                                                        <span className="flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full animate-pulse">

                                                            Action Required

                                                        </span>

                                                    )}

                                                </div>

                                                <h3 className="text-4xl font-bold text-slate-900 mb-1">{pendingCount}</h3>

                                                <p className="text-sm font-bold text-amber-800/70">Pending Review</p>

                                            </div>

                                        </div>



                                        {/* Resolved */}

                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">

                                            <div className="flex justify-between items-start mb-4">

                                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">

                                                    <CheckCircle className="h-6 w-6" />

                                                </div>

                                                <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">

                                                    Success

                                                </span>

                                            </div>

                                            <h3 className="text-4xl font-bold text-slate-900 mb-1">{resolvedCount}</h3>

                                            <p className="text-sm font-bold text-slate-500">Resolved</p>

                                        </div>

                                    </div>



                                    {/* Recent Tickets Table */}

                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">

                                            <div className="flex items-center gap-2">

                                                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>

                                                <Badge className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5">{myTickets.length}</Badge>

                                            </div>

                                            <Button variant="ghost" size="sm" onClick={() => setView('tickets')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center">

                                                View All <ChevronRight className="h-3 w-3 ml-1" />

                                            </Button>

                                        </div>

                                        <div className="overflow-x-auto">

                                            <table className="w-full text-sm text-left">

                                                <thead className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">

                                                    <tr>

                                                        <th className="px-6 py-4">Status</th>

                                                        <th className="px-6 py-4">Subject</th>

                                                        <th className="px-6 py-4">Category</th>

                                                        <th className="px-6 py-4">Priority</th>

                                                        <th className="px-6 py-4">Date</th>

                                                    </tr>

                                                </thead>

                                                <tbody className="divide-y divide-slate-100 bg-white">

                                                    {myTickets.slice(0, 5).map((ticket) => (

                                                        <tr key={ticket.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => {

                                                            console.log('Table ticket clicked:', ticket);

                                                            setSelectedTicket(ticket);

                                                        }}>

                                                            <td className="px-6 py-4">

                                                                <Badge variant={ticket.status === 'Resolved' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'warning'} className="font-medium">

                                                                    {ticket.status}

                                                                </Badge>

                                                            </td>

                                                            <td className="px-6 py-4">

                                                                <span className="font-medium text-slate-900 block">{ticket.title}</span>

                                                                <span className="text-xs text-slate-400 font-mono mt-0.5 block">{ticket.id}</span>

                                                            </td>

                                                            <td className="px-6 py-4 text-slate-500 font-medium">

                                                                {ticket.category}

                                                            </td>

                                                            <td className="px-6 py-4">

                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${

                                                                    ticket.priority === 'High' ? 'bg-red-50 text-red-600' :

                                                                    ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :

                                                                    'bg-blue-50 text-blue-600'

                                                                }`}>

                                                                    <div className={`h-1.5 w-1.5 rounded-full ${

                                                                        ticket.priority === 'High' ? 'bg-red-500' :

                                                                        ticket.priority === 'Medium' ? 'bg-amber-500' :

                                                                        'bg-blue-500'

                                                                    }`} />

                                                                    {ticket.priority}

                                                                </span>

                                                            </td>

                                                            <td className="px-6 py-4 text-slate-500 font-medium">{ticket.submittedDate}</td>

                                                        </tr>

                                                    ))}

                                                    {myTickets.length === 0 && (

                                                        <tr>

                                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">

                                                                <div className="flex flex-col items-center">

                                                                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">

                                                                        <Ticket className="h-6 w-6 text-slate-300" />

                                                                    </div>

                                                                    <p className="font-medium">No tickets found.</p>

                                                                    <p className="text-xs mt-1">Create one to get started.</p>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                </>

                            )}

                        </div>



                        {/* Right Sidebar (Notifications) */}

                        <div className="w-full lg:w-80 space-y-6">

                            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden h-full max-h-[600px] flex flex-col">

                                <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50 flex-shrink-0">

                                    <div className="flex items-center justify-between">

                                        <div className="flex items-center space-x-2">

                                            <Bell className="h-5 w-5 text-emerald-600" />

                                            <CardTitle className="text-base font-bold text-slate-900">Notifications</CardTitle>

                                            {unreadNotificationsCount > 0 && (

                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadNotificationsCount}</span>

                                            )}

                                        </div>

                                        {myNotifications.length > 0 && (

                                            <button onClick={clearAllNotifications} className="text-xs text-slate-400 hover:text-red-500 flex items-center transition-colors">

                                                <Trash2 className="h-3 w-3 mr-1" /> Clear

                                            </button>

                                        )}

                                    </div>

                                </CardHeader>

                                <CardContent className="p-0 overflow-y-auto">

                                    {myNotifications.length > 0 ? (

                                        <div className="divide-y divide-slate-100">

                                            {myNotifications.map((notif) => (

                                                <div 

                                                    key={notif.id} 

                                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-emerald-50/30' : ''}`}

                                                    onClick={() => handleNotificationClick(notif)}

                                                >

                                                    <div className="flex gap-3">

                                                        <div className={`h-2 w-2 mt-2 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${

                                                            notif.type === 'StatusUpdate' ? 'bg-blue-500 shadow-blue-200' :

                                                            notif.type === 'NewComment' ? 'bg-emerald-500 shadow-emerald-200' :

                                                            'bg-slate-400'

                                                        }`} />

                                                        <div className="flex-1">

                                                            <div className="flex justify-between items-start mb-1">

                                                                <h4 className={`text-sm font-bold ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</h4>

                                                                {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>}

                                                            </div>

                                                            <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>{notif.message}</p>

                                                            <span className="text-[10px] text-slate-400 mt-1.5 block">{notif.timestamp}</span>

                                                        </div>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    ) : (

                                        <div className="p-8 text-center text-slate-400">

                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />

                                            <p className="text-sm">No notifications yet</p>

                                        </div>

                                    )}

                                </CardContent>

                            </Card>

                        </div>

                    </div>

                )}

            </div>

        </div>

      </main>



      {/* New Ticket Modal */}

      <Modal 

        isOpen={isNewTicketModalOpen} 

        onClose={() => setIsNewTicketModalOpen(false)} 

        title="Submit New Ticket"

        maxWidth="max-w-4xl" // Wider

      >

        <form onSubmit={handleSubmitTicket} className="space-y-8 p-2">

            {/* ... Form Content ... */}

            <div>

                <Label htmlFor="title" className="mb-3 block text-lg font-bold text-black">Subject / Title</Label>

                <Input 

                    id="title" 

                    required 

                    placeholder="E.g. Incorrect grade in Math 101" 

                    value={newTicket.title}

                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}

                    className="h-auto py-4 px-5 rounded-xl text-lg bg-white border-slate-300 focus:ring-emerald-500 shadow-sm text-black font-medium placeholder:text-slate-400"

                    style={{ color: '#000000' }}

                />

            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Category */}

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">

                    <Label htmlFor="category" className="mb-3 block text-lg font-bold text-black flex items-center">

                        <Ticket className="w-5 h-5 mr-2 text-emerald-700"/> Category

                    </Label>

                    <Select 

                        id="category" 

                        value={newTicket.category}

                        onChange={handleCategoryChange}

                        className="h-auto py-4 px-5 rounded-xl text-lg bg-white border-slate-300 shadow-sm text-slate-900 font-medium"

                    >

                        <option value="Registrar" className="text-black bg-white">Registrar</option>

                        <option value="Administrative" className="text-black bg-white">Administrative</option>

                        <option value="Academic" className="text-black bg-white">Academic</option>

                    </Select>

                </div>



                {/* Priority */}

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">

                    <Label htmlFor="priority" className="mb-3 block text-lg font-bold text-black flex items-center">

                        <AlertCircle className="w-5 h-5 mr-2 text-amber-600"/> Priority Level

                    </Label>

                    <Select 

                        id="priority"

                        value={newTicket.priority}

                        onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as Priority})}

                        className="h-auto py-4 px-5 rounded-xl text-lg bg-white border-slate-300 shadow-sm text-slate-900 font-medium"

                    >

                        <option value="Low" className="text-black bg-white">Low - General Inquiry</option>

                        <option value="Medium" className="text-black bg-white">Medium - Standard Request</option>

                        <option value="High" className="text-black bg-white">High - Urgent Issue</option>

                    </Select>

                </div>

            </div>



            {/* Subcategory */}

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">

                <Label htmlFor="subcategory" className="mb-3 block text-lg font-bold text-black">

                    Specific Concern <span className="text-emerald-800 text-sm font-bold ml-2">(Based on Category)</span>

                </Label>

                <Select 

                    id="subcategory" 

                    value={newTicket.subcategory}

                    onChange={(e) => setNewTicket({...newTicket, subcategory: e.target.value})}

                    className="h-auto py-4 px-5 rounded-xl text-lg bg-white border-emerald-300 text-black shadow-sm focus:ring-emerald-500 focus:border-emerald-500 font-medium"

                >

                    {CATEGORY_OPTIONS[newTicket.category].map((option) => (

                        <option key={option} value={option} className="text-black bg-white">{option}</option>

                    ))}

                </Select>

            </div>



            {/* Description */}

            <div>

                <Label htmlFor="description" className="mb-3 block text-lg font-bold text-black">Description of Issue</Label>

                <textarea 

                    id="description"

                    className="flex min-h-[250px] w-full rounded-xl border border-slate-300 bg-white px-5 py-5 text-lg text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm placeholder:text-slate-400" 

                    placeholder="Please provide as much detail as possible..." 

                    required

                    value={newTicket.description}

                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}

                    style={{ color: '#000000' }}

                />

            </div>

            

            {/* Attachment */}

            <div>

                <Label htmlFor="attachment" className="mb-3 block text-lg font-bold text-black">Supporting Documents (Optional)</Label>

                <div className="border border-slate-300 border-dashed rounded-xl p-6 bg-slate-50 hover:bg-white hover:border-emerald-400 transition-colors cursor-pointer text-center" onClick={() => document.getElementById('ticket-file')?.click()}>

                    <input 

                        type="file" 

                        id="ticket-file" 

                        className="hidden" 

                        onChange={(e) => setTicketFile(e.target.files ? e.target.files[0] : null)}

                    />

                    {ticketFile ? (

                        <div className="flex items-center justify-center space-x-2 text-emerald-600">

                            <CheckCircle className="h-5 w-5" />

                            <span className="font-medium text-lg">{ticketFile.name}</span>

                        </div>

                    ) : (

                        <div className="flex flex-col items-center text-slate-500">

                            <Upload className="h-8 w-8 mb-2 text-slate-400" />

                            <span className="text-base font-medium">Click to upload file</span>

                            <span className="text-sm">JPG, PNG, PDF (Max 5MB)</span>

                        </div>

                    )}

                </div>

            </div>



            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">

                <Button type="button" variant="secondary" className="px-8 py-4 rounded-xl text-lg font-medium" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>

                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-10 py-4 rounded-xl text-lg font-bold shadow-xl shadow-emerald-200 hover:shadow-emerald-300 transition-all transform hover:-translate-y-1">Submit Ticket</Button>

            </div>

        </form>

      </Modal>



      {/* Student Ticket View Modal */}

      <Modal 

            isOpen={!!selectedTicket} 

            onClose={() => setSelectedTicket(null)} 

            title={selectedTicket ? `Ticket #${selectedTicket.id}` : 'Details'}

            maxWidth="max-w-6xl"

        >

            {selectedTicket && (

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Main Content */}

                    <div className="lg:col-span-2 space-y-8">

                         <div className="flex justify-between items-start">

                             <h1 className="text-3xl font-bold text-slate-900 leading-tight">{selectedTicket.title || 'Untitled Ticket'}</h1>

                             <Badge 

                                className="px-4 py-1.5 text-sm font-bold ml-4 rounded-lg whitespace-nowrap" 

                                variant={selectedTicket.status === 'Resolved' ? 'success' : selectedTicket.status === 'In Progress' ? 'info' : 'warning'}

                             >

                                {selectedTicket.status || 'Pending'}

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

                                 <p className="text-base font-semibold text-slate-900">{selectedTicket.category || 'General'}</p>

                             </div>

                             <div>

                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>

                                 <p className={`text-base font-semibold ${selectedTicket.priority === 'High' ? 'text-red-500' : 'text-slate-900'}`}>{selectedTicket.priority || 'Medium'}</p>

                             </div>

                         </div>



                         {/* Description */}

                         <div>

                             <h3 className="text-sm font-bold text-slate-500 mb-3">Description</h3>

                             <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">

                                 {selectedTicket.description || 'No description provided'}

                              </div>

                         </div>



                         {/* Attachments */}

                         {selectedTicket.attachment && (

                             <div>

                                 <h3 className="text-sm font-bold text-slate-500 mb-3">Attachments (1)</h3>

                                 <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-white">

                                    <div className="flex items-center space-x-4">

                                        <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">

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

                                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center"

                                    >

                                        <Download className="h-4 w-4 mr-1" /> Download

                                    </a>

                                </div>

                             </div>

                         )}



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

                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${comment.role === 'Student' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>

                                                {(comment.authorName || 'U').charAt(0)}

                                            </div>

                                            <div>

                                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${

                                                    comment.role === 'Student' 

                                                    ? 'bg-emerald-50 text-slate-800 rounded-tr-none' 

                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'

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

                                                                    <a href={comment.attachment.url} download={comment.attachment.name} className="text-xs font-bold text-slate-900 hover:underline hover:text-emerald-600 truncate max-w-[200px]">

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

                                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] mb-3"

                                    placeholder="Type your reply here..."

                                    value={commentText}

                                    onChange={(e) => setCommentText(e.target.value)}

                                 />

                                 <div className="flex justify-between items-center">

                                     <div className="flex items-center">

                                        <label className="cursor-pointer p-2 text-slate-900 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-full transition-colors" title="Attach file">

                                           <Paperclip className="h-4 w-4 text-black" />

                                           <input type="file" className="hidden" onChange={(e) => e.target.files && setCommentFile(e.target.files[0])} />

                                        </label>

                                        {commentFile && (

                                           <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 ml-2">

                                               <span className="text-xs font-medium text-emerald-700 max-w-[150px] truncate">{commentFile.name}</span>

                                               <button onClick={() => setCommentFile(null)} className="text-emerald-500 hover:text-red-500">

                                                   <X className="h-3 w-3" />

                                               </button>

                                           </div>

                                        )}

                                     </div>

                                     <Button 

                                        onClick={handlePostComment}

                                        disabled={!commentText.trim() && !commentFile}

                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg"

                                     >

                                         <Send className="h-4 w-4 mr-2" /> Send Reply

                                     </Button>

                                 </div>

                             </div>

                         </div>

                    </div>



                    {/* Right Column: Status & Timeline */}

                    <div className="space-y-6">

                        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">

                            <CardHeader className="bg-white border-b border-slate-50 p-4">

                                <CardTitle className="text-sm font-bold text-slate-900">Ticket Status</CardTitle>

                            </CardHeader>

                            <CardContent className="p-4 space-y-4">

                                <div className="flex justify-between items-center">

                                    <span className="text-sm text-slate-500">Current Status</span>

                                    <Badge variant={selectedTicket.status === 'Resolved' ? 'success' : selectedTicket.status === 'In Progress' ? 'info' : 'warning'}>

                                        {selectedTicket.status || 'Pending'}

                                    </Badge>

                                </div>

                                <div className="flex justify-between items-center">

                                    <span className="text-sm text-slate-500">Submitted</span>

                                    <span className="text-sm font-medium text-slate-900">{selectedTicket.submittedDate || 'Unknown'}</span>

                                </div>

                                <div className="flex justify-between items-center">

                                    <span className="text-sm text-slate-500">Last Updated</span>

                                    <span className="text-sm font-medium text-slate-900">{selectedTicket.lastUpdated || 'Not updated'}</span>

                                </div>

                            </CardContent>

                        </Card>



                        {selectedTicket.appointmentDate ? (

                             <Card className="border border-emerald-200 shadow-sm rounded-xl overflow-hidden bg-emerald-50">

                                <CardHeader className="bg-emerald-50 border-b border-emerald-100 p-4">

                                    <CardTitle className="text-sm font-bold text-emerald-900 flex items-center">

                                        <Calendar className="h-4 w-4 mr-2" /> Appointment Set

                                    </CardTitle>

                                </CardHeader>

                                <CardContent className="p-4">

                                    <div className="text-center py-2">

                                        <p className="text-3xl font-bold text-emerald-700">{selectedTicket.appointmentDate}</p>

                                        <p className="text-sm text-emerald-600 font-medium mt-1">Please bring your ID.</p>

                                    </div>

                                    <Button 

                                        onClick={() => handlePrintSlip(selectedTicket)}

                                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-emerald-600 shadow-sm"

                                    >

                                        <Printer className="mr-2 h-4 w-4" /> Print Slip

                                    </Button>

                                </CardContent>

                            </Card>

                        ) : (

                            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-slate-50">

                                <CardContent className="p-6 text-center">

                                    <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />

                                    <p className="text-sm text-slate-500 font-medium">No appointment scheduled yet.</p>

                                </CardContent>

                            </Card>

                        )}

                    </div>

                </div>

            )}

      </Modal>



      {/* Lightbox for Image Preview */}

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

    </div>

  );

};