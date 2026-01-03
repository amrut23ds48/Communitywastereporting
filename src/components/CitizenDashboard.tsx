import React, { useState } from 'react';
import { 
  ArrowLeft, Camera, MapPin, CheckCircle2, Loader2, Edit2, 
  Map as MapIcon, Send, ChevronRight, Trash2, Recycle, 
  Monitor, Leaf, Droplets, Zap, Shield, User,
  FileText, Scan, Crosshair, Navigation, ChevronLeft,
  AlertTriangle, TrendingUp, Users, Lightbulb, ArrowUpRight
} from 'lucide-react';
import { WasteMap } from './WasteMap';
import { StreetStatusOverview } from './StreetStatusOverview';
import { createReport, uploadReportImage } from '../db/reports';
import { getStreetStatistics } from '../db/analytics';
import {
  detectLocation,
  type LocationState,
  type LocationCoordinates,
} from '../utils/location';

interface CitizenDashboardProps {
  onBack: () => void;
}

// --- CONSTANTS ---
const WASTE_TYPES = [
  { id: 'general', label: 'General Trash', icon: Trash2, color: 'blue', desc: 'Household waste, non-recyclables' },
  { id: 'plastic', label: 'Plastic & Cans', icon: Recycle, color: 'emerald', desc: 'Bottles, containers, aluminum' },
  { id: 'organic', label: 'Organic', icon: Leaf, color: 'green', desc: 'Food scraps, garden waste' },
  { id: 'electronic', label: 'E-Waste', icon: Monitor, color: 'purple', desc: 'Old phones, batteries, gadgets' },
  { id: 'hazardous', label: 'Hazardous', icon: Zap, color: 'amber', desc: 'Chemicals, paint, oils' },
  { id: 'liquid', label: 'Spills/Liquid', icon: Droplets, color: 'cyan', desc: 'Sewage, leaks, standing water' },
];

// --- HELPER COMPONENTS ---

const Navbar = ({ onBack, userPoints }: { onBack: () => void, userPoints: number }) => (
  <header className="sticky top-0 z-50 w-full border-b border-emerald-100/50 bg-white/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/40">
    <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="group p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-900 to-teal-800 bg-clip-text text-transparent tracking-tight">
            Citizen Connect
          </h1>
          <div className="flex items-center gap-2">
             <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <p className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">System Operational</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Points Pill */}
        <div className="hidden md:flex items-center gap-3 px-1.5 py-1.5 pr-4 bg-white/80 backdrop-blur-xl rounded-full border border-emerald-100 shadow-sm hover:shadow-md transition-shadow cursor-default">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-2 ring-white">
            <Shield className="w-4 h-4" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Eco-Rank</span>
            <span className="text-sm font-black text-slate-800 leading-none tabular-nums">{userPoints.toLocaleString()} XP</span>
          </div>
        </div>
        
        <button className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

const WizardProgress = ({ step }: { step: number }) => (
  <div className="relative flex items-center justify-between mb-10 px-4 max-w-lg mx-auto">
    <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 bg-slate-100 rounded-full overflow-hidden">
       <div className="absolute inset-0 bg-slate-200/50" />
    </div>
    <div 
      className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_20px_rgba(16,185,129,0.4)]"
      style={{ width: `${((step - 1) / 3) * 100}%` }}
    />
    {[1, 2, 3, 4].map((s) => {
      const isCompleted = step > s;
      const isActive = step === s;
      return (
        <div key={s} className="relative z-10 flex flex-col items-center group cursor-default">
          <div 
            className={`
              w-10 h-10 rounded-xl rotate-45 flex items-center justify-center text-sm font-bold transition-all duration-500
              ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-100 border-0' : 
                isActive ? 'bg-white text-emerald-600 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-125 z-20' : 
                'bg-slate-50 border-2 border-slate-200 text-slate-300'}
            `}
          >
            <div className="-rotate-45 flex items-center justify-center">
               {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          </div>
          <span className={`absolute -bottom-8 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-emerald-600 translate-y-0 opacity-100' : isCompleted ? 'text-emerald-700/50 translate-y-0 opacity-100' : 'text-slate-300 -translate-y-2 opacity-0'}`}>
            {s === 1 ? 'Evidence' : s === 2 ? 'Location' : s === 3 ? 'Details' : 'Review'}
          </span>
        </div>
      );
    })}
  </div>
);

// --- MAIN COMPONENT ---
export function CitizenDashboard({ onBack }: CitizenDashboardProps) {
  const [step, setStep] = useState(1);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('general');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedStreet, setDetectedStreet] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [streetStats, setStreetStats] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(1250);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        requestLocation();
        nextStep();
      };
      reader.readAsDataURL(file);
    }
  };

  const requestLocation = async () => {
    setLocationState('detecting');
    try {
      const { data, error } = await detectLocation();
      if (error || !data) {
        setLocationState('error');
        setManualLocationMode(true);
      } else {
        setCoordinates(data.coordinates);
        setDetectedStreet(data.address.street_name);
        setDetectedCity(data.address.city);
        setLocationState('success');
        const { data: stats } = await getStreetStatistics(data.address.street_name);
        if (stats && stats.length > 0) setStreetStats(stats[0]);
      }
    } catch {
      setLocationState('error');
      setManualLocationMode(true);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const finalCoords = coordinates || { latitude: 0, longitude: 0, accuracy: 0 };
    try {
      const { url } = await uploadReportImage(uploadedFile!);
      if (!url) throw new Error('Upload failed');
      await createReport({
        image_url: url,
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
        street_name: detectedStreet,
        city: detectedCity,
        description: `[${wasteType.toUpperCase()}] ${description}`,
      });
      setIsSuccess(true);
      setUserPoints(prev => prev + 50);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1); setIsSuccess(false); setUploadedImage(null); setUploadedFile(null);
    setDetectedStreet(''); setDescription(''); setWasteType('general'); setLocationState('idle');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-emerald-100 selection:text-emerald-900 font-sans overflow-x-hidden">
      
      {/* --- GRID & AMBIENT BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-slate-50">
        {/* Architectural Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.4]"></div>
        
        {/* Soft Vignette Center focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(248,250,252,0.8)_100%)]"></div>

        {/* Floating Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <Navbar onBack={onBack} userPoints={userPoints} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
        
        {isSuccess ? (
          // --- SUCCESS SCREEN ---
          <div className="max-w-md mx-auto mt-20 text-center animate-in zoom-in-95 duration-500">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-30 animate-pulse" />
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 rotate-3">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Report Received!</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              Excellent work. Your report has been geolocated and queued for the sanitation team.
            </p>
            <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl mb-10 shadow-xl flex flex-col items-center gap-2 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Eco-Impact</p>
               <div className="flex items-center gap-3 relative z-10">
                 <Shield className="w-8 h-8 text-emerald-500" />
                 <span className="text-3xl font-black text-slate-800">+50 XP</span>
               </div>
            </div>
            <button 
              onClick={resetForm}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* --- LEFT: Wizard Container (7 cols) --- */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/60 p-8 md:p-10 min-h-[680px] flex flex-col relative overflow-hidden transition-all duration-500 ring-1 ring-white/60">
                
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {step === 1 && "Capture Evidence"}
                    {step === 2 && "Confirm Location"}
                    {step === 3 && "Report Details"}
                    {step === 4 && "Final Review"}
                  </h2>
                  <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Data Sync
                  </p>
                </div>

                <WizardProgress step={step} />

                <div className="flex-1 flex flex-col relative">
                  
                  {/* STEP 1: UPLOAD (Holographic Scanner) */}
                  {step === 1 && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                      <label className="group relative w-full aspect-[4/3] max-w-xl rounded-[2.5rem] bg-slate-50/50 hover:bg-emerald-50/20 border-3 border-dashed border-slate-300 hover:border-emerald-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
                        {/* Scanning Grid Animation */}
                        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(16,185,129,0.05)_25%,rgba(16,185,129,0.05)_26%,transparent_27%,transparent_74%,rgba(16,185,129,0.05)_75%,rgba(16,185,129,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(16,185,129,0.05)_25%,rgba(16,185,129,0.05)_26%,transparent_27%,transparent_74%,rgba(16,185,129,0.05)_75%,rgba(16,185,129,0.05)_76%,transparent_77%,transparent)] bg-[size:40px_40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 flex flex-col items-center p-6 text-center">
                          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                            <Camera className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">Tap to Upload Evidence</h3>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm mt-2">
                             <Scan className="w-4 h-4" /> Smart Scan Active
                          </div>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  {/* STEP 2: LOCATION GRID */}
                  {step === 2 && (
                    <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                      {/* Photo Strip */}
                      <div className="h-28 w-full bg-slate-50/80 rounded-[2rem] overflow-hidden flex items-center p-3 border border-slate-100">
                         <img src={uploadedImage!} className="h-full w-24 rounded-2xl object-cover shadow-sm" alt="Thumb" />
                         <div className="ml-5 flex-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Source Image</p>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
                               <CheckCircle2 className="w-3 h-3" />
                               <span className="text-xs font-bold">Metadata Extracted</span>
                            </div>
                         </div>
                         <button onClick={() => setStep(1)} className="mr-2 p-3 bg-white rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
                            <Edit2 className="w-4 h-4" />
                         </button>
                      </div>

                      {/* Info Grid */}
                      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                         <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                  <Crosshair className="w-6 h-6" />
                               </div>
                               <div>
                                  <h3 className="font-bold text-slate-800 text-lg">GPS Coordinates</h3>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                                     {coordinates ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : 'Waiting for data...'}
                                  </p>
                               </div>
                            </div>
                         </div>

                         {locationState === 'detecting' ? (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                               <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                               <p className="font-bold text-slate-500">Triangulating Position...</p>
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="group">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Street Address</label>
                                  <div className="relative">
                                    <input 
                                      disabled={!manualLocationMode}
                                      value={detectedStreet}
                                      onChange={(e) => setDetectedStreet(e.target.value)}
                                      className={`w-full p-4 rounded-2xl font-bold text-slate-800 transition-all outline-none border-2
                                        ${manualLocationMode 
                                          ? 'bg-white border-emerald-400 focus:ring-4 focus:ring-emerald-500/10' 
                                          : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                    />
                                    {!manualLocationMode && <div className="absolute right-4 top-4 text-emerald-500"><CheckCircle2 className="w-5 h-5"/></div>}
                                  </div>
                               </div>
                               <div className="group">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">City / Zone</label>
                                  <div className="relative">
                                    <input 
                                      disabled={!manualLocationMode}
                                      value={detectedCity}
                                      onChange={(e) => setDetectedCity(e.target.value)}
                                      className={`w-full p-4 rounded-2xl font-bold text-slate-800 transition-all outline-none border-2
                                        ${manualLocationMode 
                                          ? 'bg-white border-emerald-400 focus:ring-4 focus:ring-emerald-500/10' 
                                          : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                    />
                                    {!manualLocationMode && <div className="absolute right-4 top-4 text-emerald-500"><CheckCircle2 className="w-5 h-5"/></div>}
                                  </div>
                               </div>
                            </div>
                         )}
                         <div className="mt-6 flex justify-end">
                            <button onClick={() => setManualLocationMode(!manualLocationMode)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                               {manualLocationMode ? 'Use Auto-Detect' : 'Incorrect? Edit Manually'}
                            </button>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: DETAILS GRID */}
                  {step === 3 && (
                    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                          <Leaf className="w-5 h-5 text-emerald-600" /> Select Category
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {WASTE_TYPES.map((type) => {
                             const isSelected = wasteType === type.id;
                             return (
                                <button
                                  key={type.id}
                                  onClick={() => setWasteType(type.id)}
                                  className={`
                                    relative p-5 rounded-[2rem] border-2 text-left transition-all duration-300 group overflow-hidden
                                    ${isSelected 
                                      ? `bg-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02] z-10` 
                                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'
                                    }
                                  `}
                                >
                                  {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400 to-transparent opacity-20 rounded-bl-full" />}
                                  
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 group-hover:text-emerald-600'}`}>
                                    <type.icon className="w-6 h-6" />
                                  </div>
                                  <div className="font-bold text-slate-800 text-sm mb-1">{type.label}</div>
                                  <div className="text-[11px] text-slate-400 font-medium leading-tight">{type.desc}</div>
                                </button>
                             );
                          })}
                        </div>
                      </div>

                      <div>
                         <label className="text-sm font-bold text-slate-800 mb-3 block ml-1">Notes & Context</label>
                         <div className="relative">
                            <textarea 
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none text-sm placeholder:text-slate-400 font-medium"
                              placeholder="Describe access issues, hazards, or specific details..."
                            />
                            <div className="absolute bottom-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                               <Edit2 className="w-4 h-4 text-slate-300" />
                            </div>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: RECEIPT GRID */}
                  {step === 4 && (
                    <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
                       <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-1 relative overflow-hidden">
                          <div className="h-3 bg-[linear-gradient(45deg,transparent_25%,rgba(241,245,249,1)_25%,rgba(241,245,249,1)_50%,transparent_50%,transparent_75%,rgba(241,245,249,1)_75%,rgba(241,245,249,1)_100%)] bg-[size:20px_20px] opacity-60" />
                          
                          <div className="p-8 md:p-10">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b-2 border-dashed border-slate-100">
                                <div className="flex items-center gap-4">
                                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                      <FileText className="w-7 h-7" />
                                   </div>
                                   <div>
                                      <h3 className="font-black text-2xl text-slate-900 tracking-tight">Report Draft</h3>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for Submission</p>
                                   </div>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-500 uppercase">
                                   ID: #REQ-{Math.floor(Math.random() * 99999)}
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="col-span-1">
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Evidence</p>
                                   <img src={uploadedImage!} className="w-full aspect-square rounded-3xl object-cover shadow-lg border-4 border-white ring-1 ring-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500" alt="Evidence" />
                                </div>
                                
                                <div className="col-span-2 grid grid-cols-1 gap-4">
                                   <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-start gap-4">
                                      <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500"><MapPin className="w-5 h-5"/></div>
                                      <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Location</p>
                                         <p className="font-bold text-slate-800 text-lg leading-tight">{detectedStreet}</p>
                                         <p className="text-sm font-medium text-slate-500">{detectedCity}</p>
                                      </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-2">Type</p>
                                         <p className="font-bold text-slate-800 text-lg capitalize">{wasteType}</p>
                                      </div>
                                      <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                                         <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Impact</p>
                                         <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-emerald-500" />
                                            <span className="font-black text-emerald-800 text-xl">+50 XP</span>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                             
                             {description && (
                               <div className="mt-6 p-5 bg-yellow-50/50 rounded-3xl border border-yellow-100/50 flex gap-4">
                                 <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-1" />
                                 <div>
                                    <p className="text-xs font-bold text-yellow-600 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-yellow-800/80 font-medium italic leading-relaxed">"{description}"</p>
                                 </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* --- FOOTER CONTROLS --- */}
                {step > 1 && (
                  <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 pt-6 border-t border-slate-100 relative z-20">
                    <button 
                      onClick={prevStep}
                      disabled={submitting}
                      className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <button 
                      onClick={step < 4 ? nextStep : handleSubmit}
                      disabled={submitting || (step === 2 && locationState === 'detecting')}
                      className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg
                        ${submitting ? 'bg-slate-400' : 'bg-gradient-to-r from-slate-900 to-slate-800'}
                      `}
                    >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : step < 4 ? <ChevronRight className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                      {submitting ? 'Sending...' : step < 4 ? 'Continue' : 'Submit Report'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- RIGHT: Context Column (5 cols) --- */}
            <div className="lg:col-span-5 space-y-8 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
               
               {/* Map Card */}
               <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-white/60 p-2 ring-1 ring-black/5 h-[450px] flex flex-col">
                  <div className="px-6 py-4 flex justify-between items-center bg-white/40 rounded-t-[2rem]">
                     <span className="font-bold text-slate-700 flex items-center gap-2"><Navigation className="w-5 h-5 text-blue-500"/> Live Map</span>
                     <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> ONLINE
                     </span>
                  </div>
                  <div className="flex-1 rounded-[2rem] overflow-hidden relative border border-slate-100 mx-1 mb-1">
                     <WasteMap 
                        viewType="citizen" 
                        userLocation={coordinates}
                        cityFilter={locationState === 'success' ? detectedCity : undefined} 
                     />
                  </div>
               </div>

               {/* Right Column Content logic */}
               {locationState === 'success' && streetStats ? (
                  <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-white/60 overflow-hidden ring-1 ring-black/5">
                     <StreetStatusOverview
                       streetName={detectedStreet}
                       totalReports={streetStats.totalReports}
                       openReports={streetStats.openReports}
                       inProgressReports={streetStats.inProgressReports}
                       resolvedReports={streetStats.resolvedReports}
                     />
                  </div>
               ) : (
                  // "Theme Related Things" - Replaced the purple box
                  <div className="grid grid-cols-1 gap-6">
                     
                     {/* Widget 1: Community Pulse */}
                     <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="flex items-center justify-between mb-6 relative z-10">
                           <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                              <Users className="w-6 h-6" />
                           </div>
                           <ArrowUpRight className="w-5 h-5 text-slate-300" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10">Community Pulse</h3>
                        <div className="space-y-3 relative z-10">
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Active Reporters</span>
                              <span className="font-bold text-slate-800">1,204</span>
                           </div>
                           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[70%] rounded-full" />
                           </div>
                           <p className="text-xs text-slate-400 font-medium pt-1">
                              <span className="text-emerald-600 font-bold">12 new reports</span> in your area today.
                           </p>
                        </div>
                     </div>

                     {/* Widget 2: Eco Tip */}
                     <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[size:20px_20px]" />
                        <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-emerald-500/30 rounded-full blur-[50px]" />

                        <div className="relative z-10">
                           <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest mb-3">
                              <Lightbulb className="w-4 h-4" /> Eco Tip #42
                           </div>
                           <h4 className="text-white font-bold text-lg leading-snug">
                              "Rinsing plastic bottles increases recycling efficiency by 20%."
                           </h4>
                        </div>
                        
                        <button className="relative z-10 mt-6 w-fit px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-colors">
                           View Recycling Guide
                        </button>
                     </div>
                  </div>
               )}
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}