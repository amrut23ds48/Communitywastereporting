import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { AdminLogin } from './components/AdminLogin';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type Screen = 'role-selection' | 'admin-login' | 'citizen-dashboard' | 'admin-dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role-selection');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'role-selection':
        return <RoleSelection onSelectRole={(role) => {
          if (role === 'citizen') {
            setCurrentScreen('citizen-dashboard');
          } else {
            setCurrentScreen('admin-login');
          }
        }} />;
      case 'admin-login':
        return <AdminLogin 
          onLogin={(userId) => {
            setAdminUserId(userId);
            setCurrentScreen('admin-dashboard');
          }} 
          onBack={() => setCurrentScreen('role-selection')} 
        />;
      case 'citizen-dashboard':
        return <CitizenDashboard onBack={() => setCurrentScreen('role-selection')} />;
      case 'admin-dashboard':
        return <AdminDashboard onLogout={() => {
          setAdminUserId(null);
          setCurrentScreen('role-selection');
        }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderScreen()}
    </div>
  );
}