import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Camera, MapPin, Upload, X, CheckCircle, AlertCircle, Loader2, Edit2 } from 'lucide-react';
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

  useEffect(() => {
    requestLocation();
  }, []);

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

      // Success - store all location data
      setCoordinates(data.coordinates);
      setDetectedStreet(data.address.street_name);
      setDetectedCity(data.address.city);
      setLocationSource('auto');
      setLocationState('success');

      // Fetch street statistics
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

    // For manual location, we'll use approximate coordinates (city center)
    // In production, you could geocode the street name to get coordinates
    if (!coordinates) {
      setCoordinates({
        latitude: 0,
        longitude: 0,
        accuracy: 1000, // Low accuracy for manual entry
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!uploadedFile) {
      setSubmitError('Please upload an image');
      return;
    }

    if (locationState !== 'success') {
      setSubmitError('Please detect or enter your location before submitting');
      return;
    }

    if (!detectedStreet || !detectedCity) {
      setSubmitError('Street name and city are required');
      return;
    }

    if (!coordinates || (coordinates.latitude === 0 && coordinates.longitude === 0 && locationSource === 'manual')) {
      // For manual locations without coordinates, use a default center point
      // In production, you should geocode the address to get real coordinates
      setCoordinates({
        latitude: 37.7749, // Default fallback
        longitude: -122.4194,
        accuracy: 5000,
      });
    }

    setSubmitting(true);

    try {
      // Upload image to Supabase Storage
      const { url: imageUrl, error: uploadError } = await uploadReportImage(uploadedFile);

      if (uploadError || !imageUrl) {
        throw new Error('Failed to upload image');
      }

      // Create report
      const { data, error: reportError } = await createReport({
        image_url: imageUrl,
        latitude: coordinates!.latitude,
        longitude: coordinates!.longitude,
        street_name: detectedStreet,
        city: detectedCity,
        description: description || 'No description provided',
      });

      if (reportError) {
        throw reportError;
      }

      // Success!
      setSubmitSuccess(true);
      setDescription('');
      setUploadedImage(null);
      setUploadedFile(null);
      setLocationState('idle');
      setDetectedStreet('');
      setDetectedCity('');
      setCoordinates(null);
      setLocationSource('auto');
      setManualLocationMode(false);

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-gray-900">Citizen Dashboard</h1>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="max-w-4xl mx-auto px-4 mt-2">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">Your street has 3 new reports this week</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">2 reports on Main Street were resolved</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Report Waste Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl text-gray-900 mb-4">Report Waste</h2>

          {submitSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-700">Report submitted successfully!</p>
                <p className="text-xs text-green-600 mt-1">Thank you for helping keep our community clean.</p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Upload Photo</label>
              {!uploadedImage ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50">
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">Location will be requested automatically</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImage(null);
                      setLocationState('idle');
                      setDetectedStreet('');
                      setDetectedCity('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {locationState === 'detecting' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-sm">Detecting location...</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Status & Actions */}
            {uploadedImage && (
              <div className="space-y-3">
                {/* Location Detection State */}
                {locationState === 'detecting' && (
                  <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm text-gray-900">Detecting location...</p>
                      <p className="text-xs text-gray-500">This will help identify your street</p>
                    </div>
                  </div>
                )}

                {locationState === 'geocoding' && (
                  <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm text-gray-900">Getting address...</p>
                      <p className="text-xs text-gray-500">Please wait</p>
                    </div>
                  </div>
                )}

                {/* Location Error */}
                {locationError && !manualLocationMode && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700">{locationError}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualLocationMode(true)}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg transition-colors text-sm"
                    >
                      Enter Location Manually
                    </button>
                  </div>
                )}

                {/* Detected Location Display */}
                {locationState === 'success' && !manualLocationMode && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-700">Location detected</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setManualLocationMode(true);
                          setLocationSource('manual');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1 ml-7">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Street:</span>
                        <span className="text-sm text-gray-900">{detectedStreet}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">City:</span>
                        <span className="text-sm text-gray-900">{detectedCity}</span>
                      </div>
                      {coordinates && (
                        <div className="text-xs text-gray-500 mt-1">
                          Accuracy: {coordinates.accuracy ? `±${Math.round(coordinates.accuracy)}m` : 'Unknown'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Location Entry */}
                {manualLocationMode && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">Manual Location Entry</p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          We only use your location to identify the street where the issue is reported.
                        </p>
                      </div>
                    </div>

                    {locationError && (
                      <p className="text-xs text-red-600">{locationError}</p>
                    )}

                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Street Name *</label>
                      <input
                        type="text"
                        value={detectedStreet}
                        onChange={(e) => {
                          setDetectedStreet(e.target.value);
                          setLocationError(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                        placeholder="e.g., Main Street, Oak Avenue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={detectedCity}
                        onChange={(e) => {
                          setDetectedCity(e.target.value);
                          setLocationError(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                        placeholder="e.g., Springfield"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleManualLocationSubmit}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg transition-colors text-sm"
                      >
                        Confirm Location
                      </button>
                      {isGeolocationSupported() && (
                        <button
                          type="button"
                          onClick={() => {
                            setManualLocationMode(false);
                            setLocationError(null);
                            requestLocation();
                          }}
                          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-2 rounded-lg transition-colors text-sm"
                        >
                          Try Auto-Detect
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder="Describe the waste issue..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !uploadedImage || locationState !== 'success'}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        {/* Street Status Overview */}
        {locationState === 'success' && streetStats && (
          <StreetStatusOverview
            streetName={detectedStreet}
            totalReports={streetStats.totalReports}
            openReports={streetStats.openReports}
            inProgressReports={streetStats.inProgressReports}
            resolvedReports={streetStats.resolvedReports}
          />
        )}

        {/* Map View */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl text-gray-900 mb-4">Waste Reports Map</h2>
          <WasteMap
            viewType="citizen"
            userLocation={coordinates}
            cityFilter={locationState === 'success' ? detectedCity : undefined}
          />
        </div>
      </div>
    </div>
  );
}