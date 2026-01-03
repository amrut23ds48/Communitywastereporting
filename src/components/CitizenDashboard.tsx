import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Bell, Camera, MapPin, Upload, X, CheckCircle, 
  AlertCircle, Loader2, Edit2, ChevronRight, Leaf, 
  Trophy, History, ChevronLeft, Map as MapIcon
} from 'lucide-react';
import { WasteMap } from './WasteMap';
import { StreetStatusOverview } from './StreetStatusOverview';
import { createReport, uploadReportImage } from '../db/reports';
import { getStreetStatistics } from '../db/analytics';
import {
  detectLocation,
  isGeolocationSupported,
  validateManualLocation,
  type LocationState,
  type LocationCoordinates,
} from '../utils/location';

interface CitizenDashboardProps {
  onBack: () => void;
}

export function CitizenDashboard({ onBack }: CitizenDashboardProps) {
  // --- Existing Logic Stats ---
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [description, setDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [detectedStreet, setDetectedStreet] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [streetStats, setStreetStats] = useState<any>(null);
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [locationSource, setLocationSource] = useState<'auto' | 'manual'>('auto');
  
  // --- New UI States ---
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  useEffect(() => {
    // Only request location if we are on step 2 or image is uploaded
    if (currentStep === 2 && locationState === 'idle' && !manualLocationMode) {
      requestLocation();
    }
  }, [currentStep, manualLocationMode]);

  const requestLocation = async () => {
    setLocationState('detecting');
    setLocationError(null);

    try {
      const { data, error, state } = await detectLocation();

      if (error || !data) {
        setLocationState(state);
        setLocationError(error || 'Failed to detect location');
        setManualLocationMode(true);
        return;
      }

      setCoordinates(data.coordinates);
      setDetectedStreet(data.address.street_name);
      setDetectedCity(data.address.city);
      setLocationSource('auto');
      setLocationState('success');

      const { data: stats } = await getStreetStatistics(data.address.street_name);
      if (stats && stats.length > 0) {
        setStreetStats(stats[0]);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setLocationState('error');
      setLocationError('An unexpected error occurred');
      setManualLocationMode(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setCurrentStep(2); // Auto-advance to location step
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualLocationSubmit = () => {
    const validation = validateManualLocation(detectedStreet, detectedCity);
    if (!validation.valid) {
      setLocationError(validation.error);
      return;
    }
    setLocationSource('manual');
    setLocationState('success');
    setLocationError(null);
    setManualLocationMode(false);

    if (!coordinates) {
      setCoordinates({
        latitude: 0,
        longitude: 0,
        accuracy: 1000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!uploadedFile) { setSubmitError('Please upload an image'); return; }
    if (locationState !== 'success') { setSubmitError('Please confirm location'); return; }
    if (!detectedStreet || !detectedCity) { setSubmitError('Address required'); return; }

    // Manual fallback coord logic
    if (!coordinates || (coordinates.latitude === 0 && coordinates.longitude === 0 && locationSource === 'manual')) {
      setCoordinates({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 5000,
      });
    }

    setSubmitting(true);

    try {
      const { url: imageUrl, error: uploadError } = await uploadReportImage(uploadedFile);
      if (uploadError || !imageUrl) throw new Error('Failed to upload image');

      const { data, error: reportError } = await createReport({
        image_url: imageUrl,
        latitude: coordinates!.latitude || 0,
        longitude: coordinates!.longitude || 0,
        street_name: detectedStreet,
        city: detectedCity,
        description: description || 'No description provided',
      });

      if (reportError) throw reportError;

      setSubmitSuccess(true);
      // Reset form after success
      setTimeout(() => {
        setSubmitSuccess(false);
        setDescription('');
        setUploadedImage(null);
        setUploadedFile(null);
        setLocationState('idle');
        setDetectedStreet('');
        setDetectedCity('');
        setCoordinates(null);
        setCurrentStep(1); // Reset wizard
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Helpers ---

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex flex-col items-center relative z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
            currentStep >= step 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-white border-gray-200 text-gray-400'
          }`}>
            {step === 1 && <Camera className="w-4 h-4" />}
            {step === 2 && <MapPin className="w-4 h-4" />}
            {step === 3 && <Edit2 className="w-4 h-4" />}
          </div>
          <span className={`text-xs mt-2 font-medium ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
            {step === 1 ? 'Capture' : step === 2 ? 'Locate' : 'Details'}
          </span>
        </div>
      ))}
      {/* Progress Bar Background */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0 transform translate-y-[-50%] px-8">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out" 
          style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden font-sans text-gray-800">
      
      {/* --- Background Grids --- */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      {/* --- Navbar --- */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  CleanCity
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <Trophy className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Rank: #42 Citizen</span>
              </div>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content Grid --- */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- Left Column: Wizard & Reporting (8 cols) --- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Wizard Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Report</h2>
                    <p className="text-gray-500 text-sm mt-1">Help keep our streets clean in 3 simple steps</p>
                  </div>
                  {submitSuccess && (
                     <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in">
                       <CheckCircle className="w-4 h-4" /> Submitted
                     </span>
                  )}
                </div>

                {renderStepIndicator()}

                <form onSubmit={handleSubmit} className="mt-8 min-h-[300px]">
                  {/* Step 1: Upload */}
                  {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <label 
                        className={`
                          group relative flex flex-col items-center justify-center w-full h-80 
                          border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                          ${uploadedImage 
                            ? 'border-blue-300 bg-blue-50/30' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 bg-gray-50'}
                        `}
                      >
                        {uploadedImage ? (
                           <div className="relative w-full h-full p-2">
                             <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-sm" />
                             <button 
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 setUploadedImage(null);
                               }}
                               className="absolute top-4 right-4 p-2 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-white transition-all"
                             >
                               <X className="w-5 h-5" />
                             </button>
                           </div>
                        ) : (
                          <>
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                              <Camera className="w-10 h-10 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-700">Drop your photo here</p>
                            <p className="text-sm text-gray-500 mt-2">or click to browse files</p>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  {/* Step 2: Location */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      
                      {/* Detection Status Cards */}
                      {locationState === 'detecting' && (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                          <h3 className="text-lg font-medium">Pinpointing your location...</h3>
                          <p className="text-gray-500 max-w-xs">We are using GPS data to automatically fill the address.</p>
                        </div>
                      )}

                      {(locationState === 'success' || manualLocationMode) && (
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              Location Details
                            </h3>
                            <button
                              type="button"
                              onClick={() => setManualLocationMode(!manualLocationMode)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {manualLocationMode ? 'Use Auto-Detect' : 'Edit Manually'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Street</label>
                               <input 
                                  type="text" 
                                  value={detectedStreet}
                                  disabled={!manualLocationMode}
                                  onChange={(e) => setDetectedStreet(e.target.value)}
                                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  placeholder="Detected Street..."
                               />
                             </div>
                             <div>
                               <label className="block text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">City</label>
                               <input 
                                  type="text" 
                                  value={detectedCity}
                                  disabled={!manualLocationMode}
                                  onChange={(e) => setDetectedCity(e.target.value)}
                                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  placeholder="Detected City..."
                               />
                             </div>
                          </div>

                          {manualLocationMode && (
                            <div className="mt-4 flex justify-end">
                              <button type="button" onClick={handleManualLocationSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                                Confirm Address
                              </button>
                            </div>
                          )}

                          {locationError && (
                             <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                               <AlertCircle className="w-4 h-4" /> {locationError}
                             </div>
                          )}
                        </div>
                      )}
                      
                      {/* Stats Preview in Context */}
                      {streetStats && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                             <History className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-900 font-medium">Activity on {detectedStreet}</p>
                            <p className="text-xs text-blue-700">There are currently {streetStats.openReports} open reports nearby.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Details */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add a Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition-all"
                          placeholder="Please describe the type of waste, estimated amount, or any accessibility issues..."
                        />
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3">
                         <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                         <div className="text-sm text-yellow-800">
                           <span className="font-semibold">Note:</span> False reporting may lead to account suspension. Please ensure the image is clear and location is accurate.
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Wizard Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      disabled={currentStep === 1}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        disabled={currentStep === 1 && !uploadedImage}
                        onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                      >
                        Next Step <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting || !uploadedImage}
                        className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {submitting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Map Section (Wide) */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                   <MapIcon className="w-5 h-5 text-gray-500" /> Community Map
                 </h3>
                 <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Real-time</span>
               </div>
               <div className="h-[400px]">
                 <WasteMap
                    viewType="citizen"
                    userLocation={coordinates}
                    cityFilter={locationState === 'success' ? detectedCity : undefined}
                 />
               </div>
            </div>

          </div>

          {/* --- Right Column: Sidebar Stats (4 cols) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* My Impact Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-gray-900">My Impact</h3>
                 <div className="p-2 bg-green-100 rounded-full text-green-600">
                   <Leaf className="w-5 h-5" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-gray-50 p-4 rounded-xl text-center">
                   <div className="text-2xl font-bold text-gray-900">12</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Reports</div>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl text-center">
                   <div className="text-2xl font-bold text-green-600">8</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Resolved</div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-600">Points Earned</span>
                   <span className="font-bold text-gray-900">2,450 XP</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2">
                   <div className="bg-gradient-to-r from-blue-500 to-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                 </div>
                 <p className="text-xs text-gray-500 text-center">50 XP until next Level</p>
              </div>
            </div>

            {/* Street Status Component (Wrapped) */}
            {streetStats ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <StreetStatusOverview
                  streetName={detectedStreet}
                  totalReports={streetStats.totalReports}
                  openReports={streetStats.openReports}
                  inProgressReports={streetStats.inProgressReports}
                  resolvedReports={streetStats.resolvedReports}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white text-center">
                 <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-300 opacity-80" />
                 <h3 className="font-bold text-lg mb-2">Be the Change</h3>
                 <p className="text-indigo-100 text-sm mb-4">Report waste to climb the leaderboard and improve your neighborhood statistics.</p>
                 <button className="w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm font-medium">
                   View Leaderboard
                 </button>
              </div>
            )}

            {/* Recent Activity Mini-Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
               <h3 className="font-bold text-gray-900 mb-4">Recent Updates</h3>
               <div className="space-y-4">
                 {[1,2,3].map((_, i) => (
                   <div key={i} className="flex gap-3 items-start border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                     <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                     <div>
                       <p className="text-sm text-gray-800 font-medium">Report resolved on Elm St.</p>
                       <p className="text-xs text-gray-500">2 hours ago</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}