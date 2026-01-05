import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, X, Loader2, CheckCircle, AlertTriangle, 
  Trash2, Leaf, Construction, Battery, AlertOctagon, 
  Sparkles, ArrowRight, ScanLine
} from 'lucide-react';
import { uploadReportImage, createReport } from '../../db/reports';
import { detectLocation, type LocationState, type LocationCoordinates } from '../../utils/location';
// IMPORT THE MAP COMPONENT
import { WasteMap } from '../WasteMap'; 

export function ReportWasteView({ onSuccess }: { onSuccess: () => void }) {
  // --- State ---
  const [step, setStep] = useState<1 | 2>(1); 
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
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(2); 
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-gray-50/50">
      
      {/* --- BACKGROUND GRID EFFECT --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 top-0 h-96 w-96 bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute right-0 bottom-0 h-96 w-96 bg-emerald-100/40 rounded-full blur-[100px] -z-10"></div>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
             
             {/* LEFT COLUMN: Media & Location */}
             <div className="space-y-6 lg:sticky lg:top-8">
                 
                 {/* 1. Camera / Image Preview */}
                 <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden relative group">
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Step 1: Evidence
                    </div>

                    {!uploadedImage ? (
                      <label className="flex flex-col items-center justify-center w-full aspect-video lg:aspect-[4/3] cursor-pointer hover:bg-gray-50 transition-colors bg-slate-50/50">
                          <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Camera className="w-8 h-8 text-emerald-600"/>
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl">Click to Upload</h3>
                          <p className="text-gray-500 mt-2">Take a clear photo of the waste</p>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <div className="relative aspect-video lg:aspect-[4/3] bg-black">
                          <img src={uploadedImage} className={`w-full h-full object-cover transition-opacity duration-300 ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} alt="Uploaded waste" />
                          
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

                 {/* 2. Mini Map Visual (Using WasteMap Component) */}
                 {uploadedImage && !isAnalyzing && (
                   <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-200 p-2 animate-in slide-in-from-bottom-4">
                      {/* Map Container */}
                      <div className="relative h-48 lg:h-64 bg-slate-100 rounded-2xl overflow-hidden group">
                         
                         {/* ACTUAL MAP COMPONENT */}
                         <div className="absolute inset-0 z-0">
                            <WasteMap viewType="citizen" />
                         </div>
                         
                         {/* Location Details Overlay - Kept on top for context */}
                         <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-gray-100 z-10">
                            <div className="flex items-start justify-between">
                              <div>
                                 <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                   {locationState === 'detecting' ? 'Triangulating...' : 'Location Pin'}
                                 </p>
                                 <h4 className="font-bold text-gray-900 truncate max-w-[200px]">
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
             <div className="space-y-6 h-full flex flex-col">
                {step === 1 && !uploadedImage && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-3xl bg-white/50 backdrop-blur-sm">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                       <ArrowRight className="w-8 h-8 text-gray-300" />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-600">Waiting for Evidence</h3>
                     <p className="font-medium text-gray-400 mt-2">Upload a photo to unlock the report details</p>
                  </div>
                )}

                {step === 2 && (
                  <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 lg:p-8 space-y-8 animate-in slide-in-from-right-8 duration-500 relative flex-1">
                     
                     <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                            <p className="text-sm text-gray-500 mt-1">Provide additional context for the cleanup crew.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-700">+50 Points</span>
                        </div>
                     </div>

                     {/* Waste Category Grid */}
                     <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Waste Category</label>
                        <div className="grid grid-cols-3 gap-4">
                           {categories.map((cat) => (
                             <button
                               key={cat.id}
                               type="button"
                               onClick={() => setCategory(cat.id)}
                               className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 group ${
                                 category === cat.id 
                                   ? `${cat.bg} ${cat.border} ring-2 ring-offset-2 ring-${cat.color.split('-')[1]}-500 shadow-md` 
                                   : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-md hover:border-gray-200'
                               }`}
                             >
                               <cat.icon className={`w-8 h-8 mb-3 transition-colors ${category === cat.id ? cat.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                               <span className={`text-xs font-bold ${category === cat.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                 {cat.label}
                               </span>
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Urgency Selector */}
                     <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Urgency Level</label>
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                           {['low', 'medium', 'high'].map((lvl) => (
                             <button
                               key={lvl}
                               type="button"
                               onClick={() => setUrgency(lvl as any)}
                               className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                                 urgency === lvl 
                                   ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' 
                                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                               }`}
                             >
                               {lvl}
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Description */}
                     <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Description</label>
                        <textarea 
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none shadow-inner" 
                          rows={4} 
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                          placeholder="Add specific details (e.g., 'Blocking the sidewalk', 'Smelling bad')..."
                        />
                     </div>

                     {/* Submit Action */}
                     <div className="pt-4 mt-auto">
                       <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.99] flex items-center justify-center gap-2 text-lg"
                       >
                           {submitting ? (
                             <>
                               <Loader2 className="animate-spin w-6 h-6"/>
                               <span>Submitting Report...</span>
                             </>
                           ) : (
                             <>
                               <ScanLine className="w-6 h-6" />
                               <span>Submit Report</span>
                             </>
                           )}
                       </button>
                       <p className="text-center text-xs text-gray-400 mt-4">
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