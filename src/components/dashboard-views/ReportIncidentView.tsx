import React, { useState, useEffect } from 'react';
import {
    Camera, MapPin, X, Loader2, AlertTriangle,
    Flame, HeartPulse, Waves, Truck, Box, HelpCircle,
    ArrowRight, ScanLine, Siren
} from 'lucide-react';
import { uploadIncidentImage, createIncident } from '../../db/incidents';
import { detectLocation, type LocationState, type LocationCoordinates } from '../../utils/location';
import { CrisisMap } from '../CrisisMap';
import { Severity, IncidentCategory } from '../../types';

export function ReportIncidentView({ onSuccess }: { onSuccess: () => void }) {
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
    const [category, setCategory] = useState<IncidentCategory>('general');
    const [severity, setSeverity] = useState<Severity>('medium');

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
        if (!uploadedFile || !coordinates) return;
        setSubmitting(true);
        try {
            const { url } = await uploadIncidentImage(uploadedFile);
            if (!url) throw new Error("Upload failed");

            await createIncident({
                image_url: url,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                street_name: detectedStreet || 'Unknown Location',
                city: detectedCity || 'Unknown City',
                category,
                severity,
                description: description && description.trim().length > 0 ? description : 'No description provided',
            });

            onSuccess();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const categories = [
        { id: 'fire', label: 'Fire', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'medical', label: 'Medical', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
        { id: 'flood', label: 'Flood', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'infrastructure', label: 'Infra Fail', icon: Truck, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
        { id: 'supplies_needed', label: 'Supplies', icon: Box, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { id: 'general', label: 'Other', icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
    ];

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-slate-50/50">

            {/* --- BACKGROUND GRID EFFECT --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 top-0 h-96 w-96 bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute right-0 bottom-0 h-96 w-96 bg-rose-100/40 rounded-full blur-[100px] -z-10"></div>
            </div>

            {/* --- CONTENT --- */}
            <div className="relative z-10 w-full max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                    {/* LEFT COLUMN: Media & Location */}
                    <div className="space-y-6 lg:sticky lg:top-8">

                        {/* 1. Camera / Image Preview */}
                        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden relative group">
                            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                Step 1: Evidence
                            </div>

                            {!uploadedImage ? (
                                <label className="flex flex-col items-center justify-center w-full aspect-video lg:aspect-[4/3] cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50">
                                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Camera className="w-8 h-8 text-rose-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl">Click to Upload</h3>
                                    <p className="text-slate-500 mt-2">Take a clear photo of the incident</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            ) : (
                                <div className="relative aspect-video lg:aspect-[4/3] bg-black">
                                    <img src={uploadedImage} className={`w-full h-full object-cover transition-opacity duration-300 ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} alt="Uploaded report" />

                                    {/* AI Scanning Effect */}
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="w-full h-1 bg-rose-500 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(244,63,94,0.8)]"></div>
                                            <div className="bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-3 text-white border border-white/10">
                                                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                                                <div>
                                                    <p className="font-bold text-sm">AI Analyzing...</p>
                                                    <p className="text-xs text-rose-400">Classifying incident type</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isAnalyzing && (
                                        <button onClick={() => { setUploadedImage(null); setStep(1); }} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur hover:bg-white text-rose-600 rounded-full shadow-lg transition-all">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Mini Map Visual (Using CrisisMap Component) */}
                        {uploadedImage && !isAnalyzing && (
                            <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 p-2 animate-in slide-in-from-bottom-4">
                                {/* Map Container */}
                                <div className="relative h-48 lg:h-64 bg-slate-100 rounded-2xl overflow-hidden group">

                                    {/* ACTUAL MAP COMPONENT */}
                                    <div className="absolute inset-0 z-0">
                                        <CrisisMap viewType="community" />
                                    </div>

                                    {/* Location Details Overlay - Kept on top for context */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-100 z-10">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                                                    {locationState === 'detecting' ? 'Triangulating...' : 'Incident Location'}
                                                </p>
                                                <h4 className="font-bold text-slate-900 truncate max-w-[200px]">
                                                    {detectedStreet || "Detecting address..."}
                                                </h4>
                                                <p className="text-sm text-slate-500">{detectedCity}</p>
                                            </div>
                                            <button className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition-colors">
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
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 backdrop-blur-sm">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                    <ArrowRight className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-600">Waiting for Evidence</h3>
                                <p className="font-medium text-slate-400 mt-2">Upload a photo to unlock the report form</p>
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 lg:p-8 space-y-8 animate-in slide-in-from-right-8 duration-500 relative flex-1">

                                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Incident Details</h2>
                                        <p className="text-sm text-slate-500 mt-1">Provide critical details for responders.</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100 shadow-sm animate-pulse">
                                        <Siren className="w-4 h-4 text-rose-500" />
                                        <span className="text-sm font-bold text-rose-700">Crisis Mode</span>
                                    </div>
                                </div>

                                {/* Incident Category Grid */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Incident Category</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id as IncidentCategory)}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 group ${category === cat.id
                                                        ? `${cat.bg} ${cat.border} ring-2 ring-offset-2 ring-${cat.color.split('-')[1]}-500 shadow-md`
                                                        : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200'
                                                    }`}
                                            >
                                                <cat.icon className={`w-8 h-8 mb-3 transition-colors ${category === cat.id ? cat.color : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                <span className={`text-xs font-bold ${category === cat.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                    {cat.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Severity Selector */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Severity Level</label>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                                        {['low', 'medium', 'high', 'critical'].map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setSeverity(lvl as Severity)}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${severity === lvl
                                                        ? lvl === 'critical'
                                                            ? 'bg-red-600 text-white shadow-md transform scale-[1.02] animate-pulse'
                                                            : 'bg-white text-slate-900 shadow-md transform scale-[1.02]'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                                    }`}
                                            >
                                                {lvl === 'critical' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                        rows={4}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe the situation, dangers, or trapped persons..."
                                    />
                                </div>

                                {/* Submit Action */}
                                <div className="pt-4 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-[0.99] flex items-center justify-center gap-2 text-lg ${severity === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-500/25'
                                            }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-6 h-6" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Siren className="w-6 h-6" />
                                                <span>{severity === 'critical' ? 'REPORT CRITICAL INCIDENT' : 'Submit Report'}</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-xs text-slate-400 mt-4">
                                        By submitting, you certify this information is accurate. False reporting of critical incidents is punishable.
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
