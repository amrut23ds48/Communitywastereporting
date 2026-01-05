import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, X, Loader2, CheckCircle, AlertTriangle, 
  Trash2, Leaf, Construction, Battery, AlertOctagon, 
  Sparkles, ArrowRight, ScanLine
} from 'lucide-react';
import { uploadReportImage, createReport } from '../../db/reports';
import { detectLocation, type LocationState, type LocationCoordinates } from '../../utils/location';

export function ReportWasteView({ onSuccess }: { onSuccess: () => void }) {
  // --- State ---
  const [step, setStep] = useState<1 | 2>(1); // 1: Photo & Analyze, 2: Details
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [description, setDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedStreet, setDetectedStreet] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // New State for enhancements
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [category, setCategory] = useState<string>('general');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLocationState('detecting');
    const { data, error, state } = await detectLocation();
    if (error || !data) {
       setLocationState(state);
       return;
    }
    setCoordinates(data.coordinates);
    setDetectedStreet(data.address.street_name);
    setDetectedCity(data.address.city);
    setLocationState('success');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        // Simulate AI Analysis
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(2); // Auto-advance to details after analysis
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!uploadedFile || !coordinates) return;
    setSubmitting(true);
    try {
        const { url } = await uploadReportImage(uploadedFile);
        if(!url) throw new Error("Upload failed");
        
        const fullDescription = `[Type: ${category.toUpperCase()}] [Urgency: ${urgency.toUpperCase()}] ${description}`;

        await createReport({
            image_url: url,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            street_name: detectedStreet,
            city: detectedCity,
            description: fullDescription,
        });
        
        onSuccess();
    } catch(e) {
        console.error(e);
    } finally {
        setSubmitting(false);
    }
  };

  const categories = [
    { id: 'plastic', label: 'Plastic', icon: Trash2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'organic', label: 'Organic', icon: Leaf, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'construction', label: 'Debris', icon: Construction, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'hazardous', label: 'Hazard', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'ewaste', label: 'E-Waste', icon: Battery, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'general', label: 'General', icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  ];

  return (
    <div className="relative">
      
      {/* --- BACKGROUND GRID EFFECT --- */}
      <div className="absolute inset-0 z-0 pointer-events-none -m-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 top-0 h-96 w-96 bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute right-0 bottom-0 h-96 w-96 bg-emerald-100/40 rounded-full blur-[100px] -z-10"></div>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 max-w-5xl mx-auto">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* LEFT COLUMN: Media & Location */}
             <div className="space-y-6">
                 
                 {/* 1. Camera / Image Preview */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Step 1: Evidence
                    </div>

                    {!uploadedImage ? (
                      <label className="flex flex-col items-center justify-center w-full aspect-[4/3] cursor-pointer hover:bg-gray-50 transition-colors bg-slate-50/50">
                          <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Camera className="w-8 h-8 text-emerald-600"/>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">Click to Upload</h3>
                          <p className="text-sm text-gray-500 mt-1">Take a clear photo of the waste</p>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <div className="relative aspect-[4/3] bg-black">
                          <img src={uploadedImage} className={`w-full h-full object-cover transition-opacity duration-300 ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} />
                          
                          {/* AI Scanning Effect */}
                          {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                               <div className="w-full h-1 bg-emerald-400 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(52,211,153,0.8)]"></div>
                               <div className="bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-3 text-white border border-white/10">
                                 <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                                 <div>
                                   <p className="font-bold text-sm">AI Analyzing...</p>
                                   <p className="text-xs text-emerald-400">Identifying waste type</p>
                                 </div>
                               </div>
                            </div>
                          )}

                          {!isAnalyzing && (
                            <button onClick={() => { setUploadedImage(null); setStep(1); }} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur hover:bg-white text-red-600 rounded-full shadow-lg transition-all">
                              <X className="w-5 h-5"/>
                            </button>
                          )}
                      </div>
                    )}
                 </div>

                 {/* 2. Mini Map Visual */}
                 {uploadedImage && !isAnalyzing && (
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 animate-in slide-in-from-bottom-4">
                      <div className="relative h-48 bg-slate-100 rounded-xl overflow-hidden group">
                         {/* Decorative Map Pattern */}
                         <div className="absolute inset-0 opacity-40" style={{ 
                           backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', 
                           backgroundSize: '20px 20px' 
                         }}></div>
                         
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <span className="flex h-3 w-3 absolute -top-1 -right-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                              <MapPin className="w-10 h-10 text-emerald-600 drop-shadow-xl" fill="currentColor" />
                            </div>
                         </div>
                         
                         {/* Location Details Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-gray-100">
                            <div className="flex items-start justify-between">
                              <div>
                                 <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                   {locationState === 'detecting' ? 'Triangulating...' : 'Location Pin'}
                                 </p>
                                 <h4 className="font-bold text-gray-900">
                                   {detectedStreet || "Detecting address..."}
                                 </h4>
                                 <p className="text-sm text-gray-500">{detectedCity}</p>
                              </div>
                              <button className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 transition-colors">
                                 Edit
                              </button>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
             </div>

             {/* RIGHT COLUMN: Form Details */}
             <div className="space-y-6">
                {step === 1 && !uploadedImage && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 backdrop-blur-sm">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                       <ArrowRight className="w-6 h-6 text-gray-300" />
                     </div>
                     <p className="font-medium">Upload a photo to unlock details</p>
                  </div>
                )}

                {step === 2 && (
                  <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 space-y-6 animate-in slide-in-from-right-8 duration-500 relative">
                     
                     <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-700">+50 Points</span>
                        </div>
                     </div>

                     {/* Waste Category Grid */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Waste Category</label>
                        <div className="grid grid-cols-3 gap-3">
                           {categories.map((cat) => (
                             <button
                               key={cat.id}
                               type="button"
                               onClick={() => setCategory(cat.id)}
                               className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                                 category === cat.id 
                                   ? `${cat.bg} ${cat.border} ring-1 ring-offset-1 ring-${cat.color.split('-')[1]}-500` 
                                   : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                               }`}
                             >
                               <cat.icon className={`w-6 h-6 mb-2 ${category === cat.id ? cat.color : 'text-gray-400'}`} />
                               <span className={`text-xs font-medium ${category === cat.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                 {cat.label}
                               </span>
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Urgency Selector */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Urgency Level</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                           {['low', 'medium', 'high'].map((lvl) => (
                             <button
                               key={lvl}
                               type="button"
                               onClick={() => setUrgency(lvl as any)}
                               className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                                 urgency === lvl 
                                   ? 'bg-white text-gray-900 shadow-sm' 
                                   : 'text-gray-500 hover:text-gray-700'
                               }`}
                             >
                               {lvl}
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Description */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Description</label>
                        <textarea 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none" 
                          rows={3} 
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                          placeholder="Add specific details (e.g., 'Blocking the sidewalk', 'Smelling bad')..."
                        />
                     </div>

                     {/* Submit Action */}
                     <div className="pt-2">
                       <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                       >
                           {submitting ? (
                             <>
                               <Loader2 className="animate-spin w-5 h-5"/>
                               <span>Submitting...</span>
                             </>
                           ) : (
                             <>
                               <ScanLine className="w-5 h-5" />
                               <span>Submit Report</span>
                             </>
                           )}
                       </button>
                       <p className="text-center text-xs text-gray-400 mt-3">
                         By submitting, you certify this information is accurate.
                       </p>
                     </div>

                  </form>
                )}
             </div>
         </div>
      </div>
    </div>
  );
}