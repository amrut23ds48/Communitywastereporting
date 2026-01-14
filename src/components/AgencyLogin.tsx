import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Mail, AlertCircle, Eye, EyeOff, Key,
    Shield, Building2, Phone, Radio, Siren, Truck,
    Users, MapPin, AlertOctagon, Zap, Lock
} from 'lucide-react';
import { signInAdmin } from '../db/admin';

interface AgencyLoginProps {
    onLogin: (userId: string) => void;
    onBack: () => void;
}

export function AgencyLogin({ onLogin, onBack }: AgencyLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

    // Simulated live dispatch feed
    const [dispatchFeed, setDispatchFeed] = useState<string[]>([
        "🔥 Unit 7 dispatched to Sector 12",
        "🚑 Medical team en route - Priority Alpha",
        "✅ Incident #2847 resolved - Downtown",
        "📍 New report: Traffic hazard - Highway 4"
    ]);

    useEffect(() => {
        const updates = [
            "🚒 Fire crew returning to station",
            "⚠️ High alert: Western district",
            "👥 Volunteer team mobilized",
            "📡 All units: Status check required",
            "🔄 Shift change in progress"
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < updates.length) {
                setDispatchFeed(prev => [...prev.slice(-4), updates[i]]);
                i++;
            } else {
                i = 0;
            }
        }, 3000);
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
        <div className="min-h-screen flex bg-slate-900 font-sans">

            {/* LEFT PANEL: Agency Command Center Visual */}
            <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between overflow-hidden">

                {/* Dynamic Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950"></div>

                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}>
                </div>

                {/* Floating Emergency Icons */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Siren className="absolute top-20 left-16 w-12 h-12 text-rose-500/20 animate-pulse" />
                    <Truck className="absolute top-40 right-24 w-16 h-16 text-amber-500/15" />
                    <Radio className="absolute bottom-32 left-24 w-10 h-10 text-blue-400/20" />
                    <Shield className="absolute bottom-48 right-16 w-14 h-14 text-emerald-500/15" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-12 flex flex-col h-full">

                    {/* Branding Header */}
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/30">
                            <Siren className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Emergency Response</h1>
                            <p className="text-sm text-violet-300 font-medium">Agency Command Portal</p>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-4xl font-black text-white leading-tight mb-4">
                            Coordinating<br />
                            <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                                Rapid Response
                            </span>
                        </h2>
                        <p className="text-violet-300 text-lg max-w-md mb-8">
                            Real-time incident management for fire brigades, medical teams, and emergency services.
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                                    <span className="text-xs font-semibold text-slate-300">Active</span>
                                </div>
                                <p className="text-2xl font-bold text-white">24</p>
                                <p className="text-xs text-violet-400">Incidents</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-semibold text-slate-300">On Duty</span>
                                </div>
                                <p className="text-2xl font-bold text-white">156</p>
                                <p className="text-xs text-violet-400">Personnel</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-semibold text-slate-300">Units</span>
                                </div>
                                <p className="text-2xl font-bold text-white">42</p>
                                <p className="text-xs text-violet-400">Deployed</p>
                            </div>
                        </div>

                        {/* Live Dispatch Feed */}
                        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Live Dispatch Feed</span>
                            </div>
                            <div className="p-4 space-y-2 h-[140px] overflow-hidden">
                                {dispatchFeed.map((item, i) => (
                                    <div
                                        key={i}
                                        className="text-sm text-violet-200/80 py-1.5 border-l-2 border-violet-500/30 pl-3 animate-fade-in"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Agency Partners Footer */}
                    <div className="pt-8 border-t border-white/10">
                        <p className="text-xs text-violet-400 uppercase tracking-wider mb-4">Integrated With</p>
                        <div className="flex items-center gap-6 opacity-70">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-300" />
                                <span className="text-xs text-slate-300">Municipal Corp</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-300" />
                                <span className="text-xs text-slate-300">GIS Network</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-slate-300" />
                                <span className="text-xs text-slate-300">112 Emergency</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Login Form */}
            <div className="w-full lg:w-[52%] flex flex-col justify-center px-8 lg:px-24 py-12 bg-white relative">

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Roles</span>
                </button>

                <div className="max-w-md w-full mx-auto">

                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Agency Login</h2>
                                <p className="text-sm text-slate-500">Emergency Response Portal</p>
                            </div>
                        </div>
                        <p className="text-slate-600">
                            Access your agency dashboard to manage incidents and coordinate response teams.
                        </p>
                    </div>

                    {/* Login Method Tabs */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
                        <button
                            onClick={() => setLoginMethod('email')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginMethod === 'email'
                                ? 'bg-white text-violet-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            Email
                        </button>
                        <button
                            onClick={() => setLoginMethod('phone')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${loginMethod === 'phone'
                                ? 'bg-white text-violet-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Phone className="w-4 h-4" />
                            Phone
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-rose-700">{error}</p>
                            </div>
                        )}

                        {loginMethod === 'email' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Agency Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:ring-0 focus:border-violet-500 focus:bg-white block pl-12 p-3.5 transition-all outline-none"
                                        placeholder="admin@crisis.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Official Mobile</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:ring-0 focus:border-violet-500 focus:bg-white block pl-14 p-3.5 transition-all outline-none"
                                        placeholder="98765 00000"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-slate-700">Secure Password</label>
                                <button type="button" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:ring-0 focus:border-violet-500 focus:bg-white block pl-12 pr-12 p-3.5 transition-all outline-none"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Radio className="w-5 h-5" />
                                        Access Command Center
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Demo Access */}
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-800">Demo Access</span>
                        </div>
                        <p className="text-xs text-amber-700 mb-3">Use demo credentials to explore the agency dashboard.</p>
                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            className="w-full text-sm font-semibold text-amber-700 bg-white border border-amber-300 px-4 py-2.5 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            Login as Demo Agency
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 left-0 right-0 text-center px-6">
                    <p className="text-xs text-slate-400">
                        Secure Access • All sessions monitored • Authorized personnel only
                    </p>
                </div>
            </div>
        </div>
    );
}
