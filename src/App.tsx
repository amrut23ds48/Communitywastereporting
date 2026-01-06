import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { AdminLogin } from './components/AdminLogin';
import { CitizenLogin } from './components/CitizenLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { CitizenDashboard } from './components/CitizenDashboard';

type Screen =
  | 'role-selection'
  | 'admin-login'
  | 'citizen-login'
  | 'admin-dashboard'
  | 'citizen-dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role-selection');
  const [citizenUserId, setCitizenUserId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const renderScreen = () => {
    switch (currentScreen) {

      case 'role-selection':
        return (
          <RoleSelection
            onSelectRole={(role) => {
              if (role === 'citizen') setCurrentScreen('citizen-login');
              else setCurrentScreen('admin-login');
            }}
          />
        );

      case 'citizen-login':
        return (
          <CitizenLogin
            onLogin={(userId) => {
              setCitizenUserId(userId);
              setCurrentScreen('citizen-dashboard');
            }}
            onBack={() => setCurrentScreen('role-selection')}
          />
        );

      case 'citizen-dashboard':
        return (
          <CitizenDashboard
            userId={citizenUserId!}
            onLogout={() => {
              setCitizenUserId(null);
              setCurrentScreen('role-selection');
            }}
          />
        );

      case 'admin-login':
        return (
          <AdminLogin
            onLogin={(userId) => {
              setAdminUserId(userId);
              setCurrentScreen('admin-dashboard');
            }}
            onBack={() => setCurrentScreen('role-selection')}
          />
        );

      case 'admin-dashboard':
        return (
          <AdminDashboard
            userId={adminUserId!}
            onLogout={() => {
              setAdminUserId(null);
              setCurrentScreen('role-selection');
            }}
          />
        );

      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-white">{renderScreen()}</div>;
}
