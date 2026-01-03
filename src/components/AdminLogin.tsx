import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, AlertCircle, Eye, EyeOff, Key, 
  ShieldCheck, Smartphone, CheckCircle2,
  Server, Activity, Fingerprint, Lock,
  Database, Cpu, Globe, Terminal
} from 'lucide-react';
import { signInAdmin } from '../db/admin';

interface AdminLoginProps {
  onLogin: (userId: string) => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Simulation for the "System Logs" in the left panel
  const [logs, setLogs] = useState<string[]>([
    "[10:42:01] System Handshake Initiated...",
    "[10:42:02] Mumbai-South Node Connected",
    "[10:42:05] Database Sync: Optimal (12ms)",
    "[10:42:08] AI Classification Engine: Active"
  ]);

  useEffect(() => {
    const newLogs = [
      "Verifying SSL Certificates...",
      "Load Balancer: Stable",
      "Bangalore-East Node: Online",
      "Garbage Detection Model v2.4 Loaded",
      "Auth Token Refreshed"
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < newLogs.length) {
        setLogs(prev => [...prev.slice(-5), `[${new Date().toLocaleTimeString()}] ${newLogs[i]}`]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (loginMethod === 'email') {
        if (!email || !password) throw new Error('Please enter credentials.');
        result = await signInAdmin(email, password);
      } else {
        if (!phone || !password) throw new Error('Please enter credentials.');
        result = await signInAdmin(phone, password);
      }

      if (result.error) throw new Error(result.error.message || 'Invalid credentials');
      if (result.userId) onLogin(result.userId!);
      else throw new Error('Authentication failed');
      
    } catch (err: any) {
      setError(err.message || 'Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@waste.com');
    setPassword('admin@123');
    setLoading(true);
    setTimeout(() => {
      signInAdmin('admin@waste.com', 'admin@123').then(res => {
        if (res.userId) onLogin(res.userId);
        setLoading(false);
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      
      {/* LEFT PANEL: Enterprise Command View */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0F172A] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
        
        {/* Subtle CSS Grid Background - No Blurs */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        {/* Top: Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">SwachhFlow Admin</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Govt. Authorized Access</p>
            </div>
          </div>
        </div>

        {/* Center: Live System Monitor Widget */}
        <div className="relative z-10 space-y-6">
          
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Server Status</span>
              </div>
              <div className="text-xl font-mono text-white">99.98%</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-emerald-400">Operational</span>
              </div>
            </div>
            
            <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">AI Latency</span>
              </div>
              <div className="text-xl font-mono text-white">24ms</div>
              <div className="text-[10px] text-slate-400 mt-1">Optimization Active</div>
            </div>
          </div>

          {/* Terminal / Logs Visual */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#0F172A] px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-mono text-slate-300">System Logs</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
              </div>
            </div>
            <div className="p-4 font-mono text-xs space-y-2 h-[160px] flex flex-col justify-end">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-400 border-l-2 border-emerald-500/30 pl-2 animate-fade-in">
                  <span className="text-emerald-500 mr-2">{'>'}</span>
                  {log}
                </div>
              ))}
              <div className="w-2 h-4 bg-emerald-500 animate-pulse mt-1"></div>
            </div>
          </div>
        </div>

        {/* Bottom: Certifications */}
        <div className="relative z-10 pt-8 border-t border-slate-800/50">
          <div className="flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-semibold text-slate-300">ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-semibold text-slate-300">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-semibold text-slate-300">Digital India</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Professional Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-8 lg:px-32 py-12 bg-white relative">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Administrator Login</h2>
            <p className="text-slate-500 text-sm">Welcome back. Please enter your details to access the command dashboard.</p>
          </div>

          {/* Login Tabs */}
          <div className="flex border-b border-slate-200 mb-8">
            <button
              onClick={() => setLoginMethod('email')}
              className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
                loginMethod === 'email' 
                  ? 'text-emerald-700' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Email Access
              {loginMethod === 'email' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>}
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
                loginMethod === 'phone' 
                  ? 'text-emerald-700' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Mobile OTP
              {loginMethod === 'phone' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {loginMethod === 'email' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 block pl-11 p-3 transition-all outline-none shadow-sm hover:border-slate-400"
                    placeholder="admin@waste.com"
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Registered Mobile</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-3 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 block pl-16 p-3 transition-all outline-none shadow-sm hover:border-slate-400"
                    placeholder="98765 00000"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Forgot Password?</button>
              </div>
              <div className="relative group">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 block pl-11 pr-11 p-3 transition-all outline-none shadow-sm hover:border-slate-400"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Secure Login
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo for Devs */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 mb-2">Developer Access</p>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="text-xs font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors"
            >
              Auto-fill: admin@waste.com
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center px-6">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            Restricted Access • Monitoring Active • IP Logged
          </p>
        </div>
      </div>
    </div>
  );
}