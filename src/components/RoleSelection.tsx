import React from 'react';
import { Users, Shield } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'citizen' | 'admin') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3 text-gray-900">Community Waste Reporting</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <h2 className="text-center text-gray-700 mb-6">Who are you?</h2>
          
          <button
            onClick={() => onSelectRole('citizen')}
            className="w-full bg-white border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-6 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-400 flex items-center justify-center transition-colors">
                <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900">Citizen</div>
                <div className="text-sm text-gray-500">Report waste in your community</div>
              </div>
            </div>
            <div className="text-blue-400 group-hover:text-blue-600">→</div>
          </button>

          <button
            onClick={() => onSelectRole('admin')}
            className="w-full bg-white border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-6 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-400 flex items-center justify-center transition-colors">
                <Shield className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900">Admin</div>
                <div className="text-sm text-gray-500">Manage and resolve reports</div>
              </div>
            </div>
            <div className="text-blue-400 group-hover:text-blue-600">→</div>
          </button>
        </div>
      </div>
    </div>
  );
}
