import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Mail, AlertCircle, Eye, EyeOff, Key,
  Leaf, User, Globe, Sparkles, ArrowRight, Loader2,
  CheckCircle2, MapPin
} from 'lucide-react';
import { signInCitizen, signUpCitizen } from '../db/auth';

interface CitizenLoginProps {
  onLogin: (userId: string) => void;
  onBack: () => void;
}

export function CitizenLogin({ onLogin, onBack }: CitizenLoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // "Live Community Impact" - The citizen version of "System Logs"
  const [activities, setActivities] = useState<string[]>([
    "🔥 Sarah reported a fire hazard in Sector 4",
    "🚑 Rahul requested ambulance at Main St",
    "✅ Hazard cleared at Gandhi Road",
    "🏆 New top contributor: Priya K."
  ]);

  useEffect(() => {
    const newActivities = [
      "📸 Report verified by AI",
      "🌍 Community score up by 2%",
      "📦 Supplies delivered at Central Park",
      "🙌 500th User joined today!",
      "📍 New hotspot identified"
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < newActivities.length) {
        setActivities(prev => {
          const updated = [...prev, newActivities[i]];
          if (updated.length > 5) updated.shift();
          return updated;
        });
        i++;
      } else {
        clearInterval(interval);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!email || !password) throw new Error('Please fill in all fields.')
      if (isSignUp && !fullName) throw new Error('Please enter your name.')

      let result

      if (isSignUp) {
        result = await signUpCitizen(email, password, fullName)
      } else {
        result = await signInCitizen(email, password)
      }

      if (result.error) throw new Error(result.error.message)

      if (result.user) {
        onLogin(result.user.id)   // 🚀 citizen logged in
      } else if (isSignUp) {
        setError('Please check your email to confirm your account.')
      }

    } catch (err: any) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }


  const handleDemoLogin = () => {
    setEmail('citizen@demo.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* --- LEFT PANEL: Community Impact View --- */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#022c22] relative flex-col justify-between p-12 overflow-hidden text-white">

        {/* Background Gradients & Grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 z-0"></div>

        {/* Decorative Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-400 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-400 rounded-full blur-[100px] opacity-30"></div>

        {/* Top: Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <Leaf className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">CrisisReady</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Citizen Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Impact Feed */}
        <div className="relative z-10 space-y-8">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-50">
              <Globe className="w-5 h-5 text-emerald-300" />
              Live Community Updates
            </h3>

            <div className="space-y-3 mask-gradient-b">
              {activities.map((act, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500 hover:bg-white/15 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="text-sm font-medium text-emerald-50 leading-snug">{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative z-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 delay-100">
            <div className="text-3xl font-bold tracking-tight">12k+</div>
            <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider mt-1">Issues Resolved</div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 delay-200">
            <div className="text-3xl font-bold tracking-tight">850</div>
            <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider mt-1">Active Volunteers</div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 delay-300">
            <div className="text-3xl font-bold tracking-tight">98%</div>
            <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider mt-1">Response Rate</div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: Login/Signup Form --- */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 lg:px-32 py-12 relative overflow-hidden">

        {/* Background Effects for Right Panel */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 right-0 h-96 w-96 bg-emerald-50/50 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-semibold group z-20"
        >
          <div className="p-2 rounded-full bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Back</span>
        </button>

        <div className="relative z-10 max-w-md w-full mx-auto animate-in fade-in zoom-in duration-500">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-emerald-100">
              <Leaf className="w-3 h-3" /> Citizen Access
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              {isSignUp
                ? "Join your neighbors in making our city safer and smarter. It takes less than a minute."
                : "Log in to track your reports, view the leaderboard, and earn community rewards."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-in shake">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block pl-12 p-3.5 transition-all outline-none shadow-sm group-hover:border-gray-300"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block pl-12 p-3.5 transition-all outline-none shadow-sm group-hover:border-gray-300"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Password</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block pl-12 pr-12 p-3.5 transition-all outline-none shadow-sm group-hover:border-gray-300"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Login Securely"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Quick Demo */}
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <button
              onClick={handleDemoLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Developer Demo: Auto-fill Citizen(citizen@demo.com/demo123</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[10px] text-gray-400 font-medium">Protected by reCAPTCHA and subject to the Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
