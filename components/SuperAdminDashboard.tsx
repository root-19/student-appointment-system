
import React, { useState, useEffect } from 'react';
import { DashboardProps, User, Role, RegistrationRequest } from '../types';
import { useData } from '../context/DataContext';
import { Users, Shield, Activity, Settings, Plus, Trash2, Edit, Search, CheckCircle, FileText, Clock, UserPlus, Filter, LayoutDashboard, BarChart2, PieChart as PieChartIcon, Lock, Save, Camera, Mail, Building, User as UserIcon, Eye, EyeOff, Hash, Calendar, BookOpen, XCircle, Check, ArrowUpRight, TrendingUp, ChevronRight, AlertTriangle, Power, Server, Database, Cloud, Wifi, HardDrive, Cpu, AlertOctagon, Target, Award, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Modal, Select, Toast, Pagination } from './UIComponents';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

// --- Constants for Dropdowns ---
const PROGRAM_OPTIONS = [
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology (BSIT)' },
    { code: 'BSOA', name: 'Bachelor of Science in Office Administration (BSOA)' },
    { code: 'CCS', name: 'Certificate in Computer Science (CCS)' },
    { code: 'COA', name: 'Certificate in Office Administration (COA)' },
    { code: 'AHRT', name: 'Associate in Hotel and Restaurant Technology (AHRT)' },
    { code: 'AHRD', name: 'Associate in Human Resource Development (AHRD)' },
    { code: 'AAIS', name: 'Associate in Accounting Information System (AAIS)' },
    { code: 'MAEd', name: 'Master of Arts in Education' },
    { code: 'MBA', name: 'Master in Business Administration' },
];

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const SECTION_LETTERS = Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i)); // A-T

export const SuperAdminDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { users, addUser, updateUser, deleteUser, tickets, pendingRegistrations, approveRegistration, rejectRegistration } = useData();
  const [view, setView] = useState('home'); // 'home' | 'users' | 'analytics' | 'system' | 'settings'
  
  // User Management State
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Registrar' | 'Admin' | 'Pending'>('Student');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterYearLevel, setFilterYearLevel] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const [newUser, setNewUser] = useState<Partial<User>>({ 
      role: 'Student', 
      program: 'BSIT',
      yearLevel: '1st Year',
      section: '1A' // Default
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // User Details / Edit State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<Partial<User>>({});

  // Pending Request View State
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);

  // Settings State
  const [adminProfile, setAdminProfile] = useState({
      name: user.name,
      email: user.email,
      role: 'Super Administrator'
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Reset filters/pagination when role changes
  useEffect(() => {
    setSearchTerm('');
    setFilterProgram('All');
    setFilterYearLevel('All');
    setFilterSection('All');
    setCurrentPage(1);
  }, [selectedRole]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProgram, filterYearLevel, filterSection]);

  // --- Helpers ---
  const getSectionOptions = (yearLevel: string | undefined) => {
      if (!yearLevel) return [];
      const yearNum = yearLevel.charAt(0); // '1', '2', '3', '4'
      // If postgraduate or other, maybe standard sections? For now assuming 1-4 structure.
      if (isNaN(parseInt(yearNum))) return SECTION_LETTERS.map(l => l); 
      return SECTION_LETTERS.map(letter => `${yearNum}${letter}`);
  };

  // Update default section when new user year level changes
  const handleNewUserYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = e.target.value;
      const yearNum = newYear.charAt(0);
      setNewUser({
          ...newUser, 
          yearLevel: newYear,
          section: `${yearNum}A` // Reset to A of that year
      });
  };

  const handleEditUserYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const yearNum = newYear.charAt(0);
    setEditUserData({
        ...editUserData, 
        yearLevel: newYear,
        section: `${yearNum}A` // Reset to A of that year
    });
  };

  // --- Data Calculations for Analytics ---

  // Counts for User Management Cards
  const studentCount = users.filter(u => u.role === 'Student').length;
  const registrarCount = users.filter(u => u.role === 'Registrar').length;
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const pendingCount = pendingRegistrations.length;

  // Filter users for table based on selectedRole
  const filteredUsers = users.filter(u => {
    // Only show users matching the selected role (excluding SuperAdmin from these lists)
    const matchesRole = u.role === selectedRole;
    
    // Search logic
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.studentId && u.studentId.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter Logic
    const matchesProgram = filterProgram === 'All' || u.program === filterProgram;
    const matchesYearLevel = filterYearLevel === 'All' || u.yearLevel === filterYearLevel;
    const matchesSection = filterSection === 'All' || (u.section && u.section.includes(filterSection)); // Loose match for section filter

    if (selectedRole === 'Student') {
        return matchesRole && matchesSearch && matchesProgram && matchesYearLevel && matchesSection;
    }

    return matchesRole && matchesSearch;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 1. Ticket Analytics Data (Status)
  const statusCounts = tickets.reduce((acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const PIE_DATA = [
      { name: 'Resolved', value: statusCounts['Resolved'] || 0, color: '#10b981' }, // Emerald
      { name: 'In Progress', value: statusCounts['In Progress'] || 0, color: '#3b82f6' }, // Blue
      { name: 'Pending', value: statusCounts['Pending'] || 0, color: '#f59e0b' }, // Amber
      { name: 'Rejected', value: statusCounts['Rejected'] || 0, color: '#ef4444' }, // Red
  ].filter(d => d.value > 0);

  // 2. Category Breakdown
  const categoryCounts = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const CATEGORY_DATA = [
    { name: 'Registrar', value: categoryCounts['Registrar'] || 0, color: '#8b5cf6' }, // Purple
    { name: 'Administrative', value: categoryCounts['Administrative'] || 0, color: '#0ea5e9' }, // Sky Blue
  ].filter(d => d.value > 0);

  // 3. User Activity (Top Students)
  const studentActivity = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.studentName] = (acc[t.studentName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const TICKET_VOLUME_DATA = [
    { name: 'Mon', tickets: 12, resolved: 10 },
    { name: 'Tue', tickets: 19, resolved: 15 },
    { name: 'Wed', tickets: 15, resolved: 12 },
    { name: 'Thu', tickets: 22, resolved: 18 },
    { name: 'Fri', tickets: 30, resolved: 25 },
    { name: 'Sat', tickets: 10, resolved: 8 },
    { name: 'Sun', tickets: 5, resolved: 3 },
  ];

  // System Health Mock Data
  const ACTIVITY_LOGS = [
    ...tickets.slice(0, 3).map(t => ({ id: t.id, type: 'Ticket', message: `New ticket created by ${t.studentName}`, time: 'Just now' })),
    ...users.slice(0, 2).map(u => ({ id: u.id, type: 'User', message: `User ${u.name} logged in`, time: '5 mins ago' })),
  ];

  // --- Handlers ---

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.role) {
        addUser(newUser as Omit<User, 'id'>);
        setIsAddModalOpen(false);
        setNewUser({ role: 'Student', program: 'BSIT', yearLevel: '1st Year', section: '1A' });
        setToast({ message: "User added successfully.", type: 'success' });
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setEditUserData(user);
    setIsEditingUser(false);
  };

  const handleSaveUser = () => {
    if (selectedUser && editUserData) {
        updateUser(selectedUser.id, editUserData);
        setSelectedUser({ ...selectedUser, ...editUserData } as User);
        setIsEditingUser(false);
        setToast({ message: "User details updated successfully.", type: 'success' });
    }
  };

  const handleToggleStatus = () => {
    if (selectedUser) {
        const newStatus = selectedUser.status === 'Inactive' ? 'Active' : 'Inactive';
        updateUser(selectedUser.id, { status: newStatus });
        setSelectedUser({ ...selectedUser, status: newStatus });
        setToast({ message: `User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`, type: 'info' });
    }
  };

  const handleDeleteUserConfirmed = () => {
    if (selectedUser) {
        if (confirm('Are you strictly sure you want to delete this user? This action is irreversible.')) {
            deleteUser(selectedUser.id);
            setSelectedUser(null);
            setToast({ message: "User deleted successfully.", type: 'success' });
        }
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setTimeout(() => { 
          setIsSaving(false); 
          setToast({ message: "Profile updated successfully.", type: 'success' }); 
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
          setToast({ message: "Passwords do not match.", type: 'error' }); 
          return; 
      }
      setIsSaving(true);
      setTimeout(() => { 
          setIsSaving(false); 
          setPasswords({current:'',new:'',confirm:''}); 
          setToast({ message: "Password updated successfully.", type: 'success' }); 
      }, 1000);
  };

  const handleApprove = (id: string) => {
      approveRegistration(id);
      if (selectedRequest?.id === id) setSelectedRequest(null);
      setToast({ message: "Registration approved.", type: 'success' });
  }

  const handleReject = (id: string) => {
      if(confirm("Are you sure you want to reject this registration?")) {
          rejectRegistration(id);
          if (selectedRequest?.id === id) setSelectedRequest(null);
          setToast({ message: "Registration rejected.", type: 'info' });
      }
  }

  const handleDownloadDocument = (req: RegistrationRequest) => {
    if (req.documentUrl) {
      const link = document.createElement('a');
      link.href = req.documentUrl;
      link.download = req.documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setToast({ message: "Document not available or URL expired.", type: "error" });
    }
  };

  const NavItem = ({ id, label, icon: Icon, badgeCount }: any) => (
      <button 
        onClick={() => setView(id)} 
        className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200 group ${
            view === id 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 translate-x-2' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
        }`}
      >
        <Icon className={`h-5 w-5 mr-3 transition-colors ${view === id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} /> 
        <span className="font-medium">{label}</span>
        {badgeCount > 0 && (
           <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">{badgeCount}</span>
        )}
      </button>
  );

  const RoleCard = ({ role, label, count, icon: Icon, colorClass, iconBgClass, isSelected, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`cursor-pointer relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${isSelected ? 'ring-4 ring-offset-2 ring-slate-200 shadow-xl scale-[1.02]' : 'hover:shadow-lg hover:-translate-y-1'} ${colorClass} text-white`}
    >
        <div className="flex items-center justify-between z-10 relative">
            <div>
                <h3 className="text-4xl font-bold mb-1">{count}</h3>
                <p className="text-sm font-medium opacity-90">{label}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBgClass} backdrop-blur-sm`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 z-0"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center space-x-3 border-b border-slate-800/50">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Shield className="text-white h-6 w-6" />
            </div>
            <div>
                <span className="font-bold text-xl block leading-none tracking-tight">SuperAdmin</span>
                <span className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1 block">Control Panel</span>
            </div>
        </div>
        
        <nav className="flex-1 px-6 py-6 space-y-2">
            <NavItem id="home" label="Dashboard" icon={LayoutDashboard} />
            <NavItem id="users" label="User Management" icon={Users} badgeCount={pendingRegistrations.length} />
            <NavItem id="analytics" label="Analytics" icon={BarChart2} />
            <NavItem id="system" label="System Health" icon={Activity} />
            <NavItem id="settings" label="Settings" icon={Settings} />
        </nav>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800/50">
            <div className="flex items-center mb-6 px-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold shadow-md border-2 border-slate-800 overflow-hidden">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        "SA"
                    )}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-bold text-white">System Admin</p>
                    <div className="flex items-center mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        <p className="text-xs text-slate-400 font-medium">Online</p>
                    </div>
                </div>
            </div>
            <Button variant="danger" className="w-full rounded-xl py-3 font-bold bg-red-600/90 hover:bg-red-600 border-none" onClick={onLogout}>
                Sign Out
            </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">
                {view === 'home' ? 'Dashboard Overview' : 
                 view === 'users' ? 'User Management' :
                 view === 'analytics' ? 'Analytics & Reports' :
                 view === 'settings' ? 'System Settings' : 'System Overview'}
             </h2>
             <div className="flex items-center space-x-4">
                <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
             </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* Dashboard View */}
            {view === 'home' && (
                <>
                    {/* Welcome Banner */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl mb-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">Welcome back, Administrator</h1>
                            <p className="text-slate-300 max-w-xl">
                                You have <span className="text-white font-bold">{pendingRegistrations.length} pending registration requests</span> and the system is operating at optimal performance.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <Button onClick={() => { setView('users'); setSelectedRole('Pending'); }} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold rounded-xl shadow-lg shadow-emerald-500/20">
                                    Review Pending
                                </Button>
                                <Button onClick={() => setView('analytics')} variant="outline" className="border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl">
                                    View Reports
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row - Redesigned */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Users Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        <TrendingUp className="h-3 w-3 mr-1" /> +12%
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-1">{users.filter(u => u.role !== 'SuperAdmin').length}</h3>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Users</p>
                            </div>
                        </div>

                        {/* Tickets Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-sm border border-purple-100">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        <TrendingUp className="h-3 w-3 mr-1" /> +5%
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-1">{tickets.length}</h3>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Tickets</p>
                            </div>
                        </div>

                        {/* Requests Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm border border-amber-100">
                                        <UserPlus className="h-6 w-6" />
                                    </div>
                                    {pendingRegistrations.length > 0 && (
                                        <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-pulse">
                                            Action Needed
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-1">{pendingRegistrations.length}</h3>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">New Requests</p>
                            </div>
                        </div>

                        {/* System Status Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                        100% Uptime
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-emerald-600 mb-1">Healthy</h3>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">System Status</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* User Management View */}
            {view === 'users' && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                            <p className="text-slate-500">Manage all system users and approvals</p>
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </div>

                    {/* Role Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <RoleCard 
                            role="Student" 
                            label="Students" 
                            count={studentCount} 
                            icon={UserIcon} 
                            colorClass="bg-gradient-to-br from-orange-400 to-orange-600"
                            iconBgClass="bg-white/20"
                            isSelected={selectedRole === 'Student'}
                            onClick={() => setSelectedRole('Student')}
                        />
                        <RoleCard 
                            role="Registrar" 
                            label="Registrar Staff" 
                            count={registrarCount} 
                            icon={Users} 
                            colorClass="bg-gradient-to-br from-teal-400 to-teal-600"
                            iconBgClass="bg-white/20"
                            isSelected={selectedRole === 'Registrar'}
                            onClick={() => setSelectedRole('Registrar')}
                        />
                        <RoleCard 
                            role="Admin" 
                            label="Administrative" 
                            count={adminCount} 
                            icon={Building} 
                            colorClass="bg-gradient-to-br from-pink-400 to-pink-600"
                            iconBgClass="bg-white/20"
                            isSelected={selectedRole === 'Admin'}
                            onClick={() => setSelectedRole('Admin')}
                        />
                        <RoleCard 
                            role="Pending" 
                            label="Pending Accounts" 
                            count={pendingCount} 
                            icon={Clock} 
                            colorClass="bg-gradient-to-br from-purple-400 to-purple-600"
                            iconBgClass="bg-white/20"
                            isSelected={selectedRole === 'Pending'}
                            onClick={() => setSelectedRole('Pending')}
                        />
                    </div>

                    {/* Content Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 flex flex-col md:flex-row gap-4">
                                    {/* Search - Moved to Left Side */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input 
                                            className="pl-10 w-full h-11 rounded-xl text-sm border-slate-200 focus:ring-emerald-500" 
                                            placeholder={selectedRole === 'Student' ? "Search name, email, or Student ID..." : "Search users..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    {/* Filters - Only for Students */}
                                    {selectedRole === 'Student' && (
                                        <div className="flex gap-2 flex-wrap md:flex-nowrap">
                                            <Select 
                                                value={filterProgram} 
                                                onChange={(e) => setFilterProgram(e.target.value)}
                                                className="h-11 rounded-xl text-sm border-slate-200 min-w-[120px]"
                                            >
                                                <option value="All">All Programs</option>
                                                {PROGRAM_OPTIONS.map(p => (
                                                    <option key={p.code} value={p.code}>{p.code}</option>
                                                ))}
                                            </Select>
                                            <Select 
                                                value={filterYearLevel} 
                                                onChange={(e) => setFilterYearLevel(e.target.value)}
                                                className="h-11 rounded-xl text-sm border-slate-200 min-w-[120px]"
                                            >
                                                <option value="All">All Levels</option>
                                                {YEAR_LEVELS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </Select>
                                            <Select 
                                                value={filterSection} 
                                                onChange={(e) => setFilterSection(e.target.value)}
                                                className="h-11 rounded-xl text-sm border-slate-200 min-w-[120px]"
                                            >
                                                <option value="All">All Sections</option>
                                                {SECTION_LETTERS.map(s => (
                                                    <option key={s} value={s}>Section {s}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">
                                {selectedRole === 'Pending' 
                                    ? 'Review and approve new account registrations.' 
                                    : `Manage all active ${selectedRole.toLowerCase()} accounts.`}
                            </div>
                        </div>

                        {selectedRole === 'Pending' ? (
                            <div className="p-8 bg-slate-50/50 flex-1">
                                {pendingRegistrations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingRegistrations.map(req => (
                                            <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                                            {req.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{req.name}</h4>
                                                            <p className="text-xs text-slate-500">{req.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                                                </div>
                                                
                                                <div className="space-y-2 mb-6">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Student ID</span>
                                                        <span className="font-mono font-medium">{req.studentId}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Program</span>
                                                        <span className="font-medium">{req.program}</span>
                                                    </div>
                                                     <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Submitted</span>
                                                        <span className="font-medium">{req.dateSubmitted}</span>
                                                    </div>
                                                </div>

                                                <Button onClick={() => setSelectedRequest(req)} className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold shadow-sm">
                                                    View Application
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="mx-auto h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
                                        <p className="text-slate-500 mt-2">No pending registration requests at the moment.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                                {selectedRole === 'Student' && (
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                                                )}
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                                                                {u.avatar ? <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-900">{u.name}</p>
                                                                <p className="text-xs text-slate-500">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="default" className="bg-slate-100 text-slate-600 border-slate-200">{u.role}</Badge>
                                                    </td>
                                                    {selectedRole === 'Student' && (
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-xs font-bold text-slate-700">{u.studentId || 'N/A'}</span>
                                                                <span className="text-xs">{u.program} - {u.yearLevel} ({u.section})</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {u.status === 'Active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleViewUser(u)} 
                                                            className="bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm font-bold px-4"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" /> View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {paginatedUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                        No users found matching the criteria.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="border-t border-slate-100 bg-white">
                                        <Pagination 
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Analytics View */}
            {view === 'analytics' && (
                 <div className="space-y-8">
                    <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
                    
                    {/* Top Row Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                            <CardHeader>
                                <CardTitle>Ticket Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={PIE_DATA}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {PIE_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                         </Card>

                         <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                            <CardHeader>
                                <CardTitle>Ticket Volume by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={CATEGORY_DATA} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                            {CATEGORY_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                         </Card>
                    </div>

                    {/* Bottom Row - Trend */}
                    <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Weekly Ticket Volume Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={TICKET_VOLUME_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" />
                                    <defs>
                                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                 </div>
            )}

            {/* System View */}
            {view === 'system' && (
                 <div className="space-y-8">
                     <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-emerald-50 border-emerald-100 text-emerald-900">
                             <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <Server className="h-6 w-6" />
                                     <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 px-2 py-1 rounded">Healthy</span>
                                 </div>
                                 <h3 className="text-2xl font-bold">99.9%</h3>
                                 <p className="text-sm opacity-80">Server Uptime</p>
                             </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-100 text-blue-900">
                             <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <Database className="h-6 w-6" />
                                     <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 px-2 py-1 rounded">Optimal</span>
                                 </div>
                                 <h3 className="text-2xl font-bold">24ms</h3>
                                 <p className="text-sm opacity-80">Database Latency</p>
                             </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-100 text-purple-900">
                             <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <Cloud className="h-6 w-6" />
                                     <span className="text-xs font-bold uppercase tracking-wider bg-purple-100 px-2 py-1 rounded">Synced</span>
                                 </div>
                                 <h3 className="text-2xl font-bold">1.2 GB</h3>
                                 <p className="text-sm opacity-80">Storage Used</p>
                             </CardContent>
                        </Card>
                        <Card className="bg-amber-50 border-amber-100 text-amber-900">
                             <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <Cpu className="h-6 w-6" />
                                     <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 px-2 py-1 rounded">Low Load</span>
                                 </div>
                                 <h3 className="text-2xl font-bold">12%</h3>
                                 <p className="text-sm opacity-80">CPU Usage</p>
                             </CardContent>
                        </Card>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity Logs</h3>
                         <div className="space-y-4">
                             {ACTIVITY_LOGS.map((log, i) => (
                                 <div key={i} className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                     <div className={`mt-1 h-2 w-2 rounded-full ${log.type === 'Error' ? 'bg-red-500' : 'bg-emerald-500'} mr-4`}></div>
                                     <div className="flex-1">
                                         <p className="text-sm text-slate-800 font-medium">{log.message}</p>
                                         <p className="text-xs text-slate-400 mt-0.5">{log.time} • {log.type}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
            )}

            {/* Settings View */}
            {view === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-10 pb-10">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                            <p className="text-slate-500 text-lg mt-2">Manage your administrative profile and security preferences.</p>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl bg-white">
                        <CardHeader className="bg-white border-b border-slate-100 p-8">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                    <UserIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Admin Profile</CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">Update your personal details.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                             <div className="flex flex-col md:flex-row gap-10">
                                 {/* Avatar Section */}
                                 <div className="flex flex-col items-center space-y-4 pt-2">
                                     <div className="relative group cursor-pointer" onClick={() => document.getElementById('admin-avatar-upload')?.click()}>
                                         <div className="h-32 w-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white border-4 border-white shadow-lg overflow-hidden relative">
                                             {user.avatar ? (
                                                 <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                             ) : (
                                                 <span>SA</span>
                                             )}
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Camera className="h-8 w-8 text-white" />
                                             </div>
                                         </div>
                                         <input 
                                             type="file" 
                                             id="admin-avatar-upload" 
                                             className="hidden" 
                                             accept="image/*"
                                             onChange={handleAvatarChange}
                                         />
                                         <p className="text-xs text-slate-500 mt-2 text-center">Click to change</p>
                                     </div>
                                 </div>

                                 {/* Form Section */}
                                 <div className="flex-1 space-y-6">
                                     <form onSubmit={handleProfileUpdate}>
                                         <div className="grid grid-cols-1 gap-6 mb-6">
                                             <div>
                                                 <Label className="mb-2 block font-bold text-slate-700">Full Name</Label>
                                                 <Input 
                                                     value={adminProfile.name} 
                                                     onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                                                     className="py-3 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                 />
                                             </div>
                                             <div>
                                                 <Label className="mb-2 block font-bold text-slate-700">Email Address</Label>
                                                 <Input 
                                                     value={adminProfile.email} 
                                                     onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                                                     className="py-3 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                 />
                                             </div>
                                             <div>
                                                 <Label className="mb-2 block font-bold text-slate-700">Role</Label>
                                                 <Input 
                                                     value={adminProfile.role} 
                                                     readOnly
                                                     className="py-3 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                                                 />
                                             </div>
                                         </div>
                                         <div className="flex justify-end">
                                             <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-lg" disabled={isSaving}>
                                                 {isSaving ? 'Saving...' : 'Save Changes'}
                                             </Button>
                                         </div>
                                     </form>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl bg-white">
                        <CardHeader className="bg-white border-b border-slate-100 p-8">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Security</CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">Manage your password.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handlePasswordUpdate} className="max-w-lg">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="mb-2 block font-bold text-slate-700">Current Password</Label>
                                        <div className="relative">
                                            <Input 
                                                type={showCurrentPassword ? "text" : "password"} 
                                                value={passwords.current} 
                                                onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                                                required 
                                                className="py-3 rounded-xl pr-10" 
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
                                    <div>
                                        <Label className="mb-2 block font-bold text-slate-700">New Password</Label>
                                        <div className="relative">
                                            <Input 
                                                type={showNewPassword ? "text" : "password"} 
                                                value={passwords.new} 
                                                onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                                                required 
                                                className="py-3 rounded-xl pr-10" 
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
                                        <Label className="mb-2 block font-bold text-slate-700">Confirm Password</Label>
                                        <div className="relative">
                                            <Input 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                value={passwords.confirm} 
                                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                                                required 
                                                className="py-3 rounded-xl pr-10" 
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
                                <div className="pt-6">
                                    <Button type="submit" variant="outline" className="border-slate-300 font-bold" disabled={isSaving}>
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Application Details Modal - NEW */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Application Details"
                maxWidth="max-w-3xl"
            >
                {selectedRequest && (
                    <div className="space-y-8">
                        {/* Top Profile Section */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                             <div className="h-24 w-24 rounded-full bg-white border-4 border-emerald-100 flex items-center justify-center text-4xl font-bold text-emerald-600 mb-4 shadow-sm z-10">
                                {selectedRequest.name.charAt(0)}
                            </div>
                            <div className="z-10">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedRequest.name}</h3>
                                     <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>
                                </div>
                                <p className="text-slate-500 mb-3">{selectedRequest.email}</p>
                                <Badge variant="default" className="bg-white border-slate-200 text-slate-700 px-3 py-1">Student</Badge>
                            </div>
                            {/* Decorative background */}
                             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50 opacity-50"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Academic Information */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Academic Information</h4>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Hash className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Student ID</p>
                                            <p className="text-base text-slate-900 font-mono">{selectedRequest.studentId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Program / Year / Section</p>
                                            <p className="text-base text-slate-900 font-bold">{selectedRequest.program}</p>
                                            <p className="text-sm text-slate-500">{selectedRequest.yearLevel} - Section {selectedRequest.section}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Date Applied</p>
                                            <p className="text-base text-slate-900">{selectedRequest.dateSubmitted}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Documents</h4>
                                <div 
                                    className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors group"
                                    onClick={() => handleDownloadDocument(selectedRequest)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-sm text-red-500">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{selectedRequest.documentName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Verification Doc</p>
                                        </div>
                                    </div>
                                    <div className="text-emerald-600 opacity-60 group-hover:opacity-100">
                                        <Eye className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="text-xs text-center text-slate-400 mt-2">* Click to download/preview document</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-12 font-bold"
                                onClick={() => handleReject(selectedRequest.id)}
                            >
                                <XCircle className="h-5 w-5 mr-2" /> Reject Application
                            </Button>
                            <Button 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-12 font-bold"
                                onClick={() => handleApprove(selectedRequest.id)}
                            >
                                <Check className="h-5 w-5 mr-2" /> Approve & Create Account
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New User"
                maxWidth="max-w-4xl" // Wider modal
            >
                <form onSubmit={handleAddUser} className="space-y-6 p-2">
                    
                    {/* Account Information Group */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                         <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-2">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <UserIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Account Information</h3>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-2 block font-bold text-slate-700">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <Input 
                                        required 
                                        value={newUser.name || ''} 
                                        onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                                        placeholder="e.g. John Doe"
                                        className="pl-12 py-3 h-12 rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500" 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <Label className="mb-2 block font-bold text-slate-700">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={newUser.email || ''} 
                                        onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                                        placeholder="e.g. john@ptc.edu.ph"
                                        className="pl-12 py-3 h-12 rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Label className="mb-2 block font-bold text-slate-700">System Role</Label>
                                <div className="relative">
                                     <Shield className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <Select 
                                        value={newUser.role} 
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                                        className="pl-12 py-3 h-12 rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 font-medium"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Registrar">Registrar Staff</option>
                                        <option value="Admin">Administrator</option>
                                    </Select>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 ml-1">
                                    {newUser.role === 'Student' ? 'Can submit tickets and view own records.' : 
                                     newUser.role === 'Registrar' ? 'Can manage registrar tickets and student records.' : 
                                     'Can manage administrative tickets and facilities.'}
                                </p>
                            </div>
                         </div>
                    </div>

                    {/* Academic Details (Conditional) */}
                    {newUser.role === 'Student' && (
                         <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                             <div className="flex items-center space-x-2 border-b border-blue-200 pb-2 mb-2">
                                <div className="p-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Academic Details</h3>
                             </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="mb-2 block font-bold text-slate-700">Student ID</Label>
                                    <div className="relative">
                                         <Hash className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                        <Input 
                                            value={newUser.studentId || ''} 
                                            onChange={(e) => setNewUser({...newUser, studentId: e.target.value})} 
                                            placeholder="2024-XXXX"
                                            className="pl-12 py-3 h-12 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500" 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <Label className="mb-2 block font-bold text-slate-700">Program</Label>
                                     <Select 
                                        value={newUser.program || 'BSIT'} 
                                        onChange={(e) => setNewUser({...newUser, program: e.target.value})}
                                        className="py-3 h-12 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {PROGRAM_OPTIONS.map(p => (
                                            <option key={p.code} value={p.code}>{p.name}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label className="mb-2 block font-bold text-slate-700">Year Level</Label>
                                     <Select 
                                        value={newUser.yearLevel || '1st Year'} 
                                        onChange={handleNewUserYearChange}
                                        className="py-3 h-12 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {YEAR_LEVELS.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label className="mb-2 block font-bold text-slate-700">Section</Label>
                                     <Select 
                                        value={newUser.section || ''} 
                                        onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                                        className="py-3 h-12 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {getSectionOptions(newUser.yearLevel || '1st Year').map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                         </div>
                    )}

                    <div className="flex justify-end pt-4 gap-4 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 h-auto text-base">Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 h-auto text-base font-bold shadow-lg shadow-emerald-200">
                            <Plus className="h-5 w-5 mr-2" />
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>
            
            {/* Edit User Modal (Details View with Actions) */}
            <Modal
                isOpen={!!selectedUser && !isEditingUser}
                onClose={() => setSelectedUser(null)}
                title="User Details"
                maxWidth="max-w-3xl"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
                             <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden">
                                 {selectedUser.avatar ? <img src={selectedUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}
                             </div>
                             <div>
                                 <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                                 <p className="text-slate-500">{selectedUser.email}</p>
                                 <div className="flex gap-2 mt-2">
                                     <Badge variant="default" className="bg-slate-100 text-slate-700">{selectedUser.role}</Badge>
                                     <Badge variant={selectedUser.status === 'Active' ? 'success' : 'danger'}>{selectedUser.status}</Badge>
                                 </div>
                             </div>
                        </div>
                        
                        {selectedUser.role === 'Student' && (
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</p>
                                    <p className="font-mono font-medium text-slate-900">{selectedUser.studentId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program</p>
                                    <p className="font-medium text-slate-900">{selectedUser.program || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year Level</p>
                                    <p className="font-medium text-slate-900">{selectedUser.yearLevel || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section</p>
                                    <p className="font-medium text-slate-900">{selectedUser.section || 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                             <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Management Actions</h4>
                             <div className="grid grid-cols-1 gap-3">
                                 <Button variant="outline" className="justify-start h-12 border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setIsEditingUser(true)}>
                                     <Edit className="h-4 w-4 mr-3 text-slate-500" /> Update Details
                                 </Button>
                                 <Button variant="outline" className="justify-start h-12 border-slate-200 hover:bg-slate-50 text-slate-700" onClick={handleToggleStatus}>
                                     {selectedUser.status === 'Active' ? <XCircle className="h-4 w-4 mr-3 text-red-500" /> : <CheckCircle className="h-4 w-4 mr-3 text-emerald-500" />}
                                     {selectedUser.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                 </Button>
                                 <Button variant="danger" className="justify-start h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" onClick={handleDeleteUserConfirmed}>
                                     <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
                                 </Button>
                             </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit User Form Modal - Redesigned */}
            <Modal
                isOpen={isEditingUser}
                onClose={() => setIsEditingUser(false)}
                title="Update User Profile"
                maxWidth="max-w-4xl"
            >
                <div className="p-2 space-y-6">
                     {/* Personal Info Group */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        value={editUserData.name || ''} 
                                        onChange={(e) => setEditUserData({...editUserData, name: e.target.value})} 
                                        className="pl-10 h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        value={editUserData.email || ''} 
                                        onChange={(e) => setEditUserData({...editUserData, email: e.target.value})} 
                                        className="pl-10 h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Details - Only if Student */}
                    {selectedUser?.role === 'Student' && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                             <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-2">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <BookOpen className="h-5 w-5 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Academic Information</h3>
                             </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Student ID</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input 
                                            value={editUserData.studentId || ''} 
                                            onChange={(e) => setEditUserData({...editUserData, studentId: e.target.value})} 
                                            className="pl-10 h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Program</Label>
                                    <Select 
                                        value={editUserData.program || ''} 
                                        onChange={(e) => setEditUserData({...editUserData, program: e.target.value})}
                                        className="h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                    >
                                        {PROGRAM_OPTIONS.map(p => (
                                            <option key={p.code} value={p.code}>{p.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Year Level</Label>
                                    <Select 
                                        value={editUserData.yearLevel || ''} 
                                        onChange={handleEditUserYearChange}
                                        className="h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                    >
                                         {YEAR_LEVELS.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-bold text-slate-700 text-sm">Section</Label>
                                    <Select 
                                        value={editUserData.section || ''} 
                                        onChange={(e) => setEditUserData({...editUserData, section: e.target.value})}
                                        className="h-11 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                    >
                                        {getSectionOptions(editUserData.yearLevel).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 gap-3 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsEditingUser(false)} className="px-6 h-11 text-base font-medium rounded-xl">Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 text-base font-bold shadow-lg shadow-blue-200 rounded-xl" onClick={handleSaveUser}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
      </main>
    </div>
  );
};
