
import React from 'react';
import Login from './components/Login';
import { StudentDashboard } from './components/StudentDashboard';
import { RegistrarDashboard } from './components/RegistrarDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AcademicDashboard } from './components/AcademicDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DataProvider, useData } from './context/DataContext';

const AppContent: React.FC = () => {
  const { currentUser, login, logout } = useData();

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    return success;
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Role-based Routing
  switch (currentUser.role) {
    case 'Student':
      return <StudentDashboard user={currentUser} onLogout={logout} />;
    case 'Registrar':
      return <RegistrarDashboard user={currentUser} onLogout={logout} />;
    case 'Admin':
      return <AdminDashboard user={currentUser} onLogout={logout} />;
    case 'Academic':
      return <AcademicDashboard user={currentUser} onLogout={logout} />;
    case 'SuperAdmin':
      return <SuperAdminDashboard user={currentUser} onLogout={logout} />;
    default:
      return <div>Unknown Role. <button onClick={logout}>Logout</button></div>;
  }
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;