import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { AdminLogin } from './components/AdminLogin';
import { CitizenLogin } from './components/CitizenLogin'; // Import the new component
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';

// Add 'citizen-login' to the type definition
type Screen = 'role-selection' | 'admin-login' | 'citizen-login' | 'citizen-dashboard' | 'admin-dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role-selection');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [citizenUserId, setCitizenUserId] = useState<string | null>(null); // Store citizen ID

  const renderScreen = () => {
    switch (currentScreen) {
      case 'role-selection':
        return <RoleSelection onSelectRole={(role) => {
          if (role === 'citizen') {
            setCurrentScreen('citizen-login'); // Go to login first, not dashboard
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

      case 'citizen-login':
        return <CitizenLogin 
          onLogin={(userId) => {
            setCitizenUserId(userId);
            setCurrentScreen('citizen-dashboard');
          }}
          onBack={() => setCurrentScreen('role-selection')}
        />;

      case 'citizen-dashboard':
        return <CitizenDashboard 
          onBack={() => {
            // Optional: You can choose to go back to login or role selection
            // For now, logging out goes back to roles
            setCitizenUserId(null); 
            setCurrentScreen('role-selection');
          }} 
        />;

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