/**
 * Location Detection & Reverse Geocoding Utility
 * Privacy-first, single-use location detection for waste reporting
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationAddress {
  street_name: string;
  city: string;
  state?: string;
  postal_code?: string;
  full_address?: string;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  address: LocationAddress;
  source: 'auto' | 'manual';
}

export type LocationState = 
  | 'idle'
  | 'requesting-permission'
  | 'detecting'
  | 'geocoding'
  | 'success'
  | 'permission-denied'
  | 'timeout'
  | 'unsupported'
  | 'geocoding-failed'
  | 'error';

/**
 * Check if geolocation is supported by the browser
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Get user's current location coordinates
 */
export async function getCurrentLocation(): Promise<{
  data: LocationCoordinates | null;
  error: LocationState | null;
}> {
  if (!isGeolocationSupported()) {
    return { data: null, error: 'unsupported' };
  }

  return new Promise((resolve) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0, // Don't use cached location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          data: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          error: null,
        });
      },
      (error) => {
        let errorState: LocationState = 'error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorState = 'permission-denied';
            break;
          case error.TIMEOUT:
            errorState = 'timeout';
            break;
          case error.POSITION_UNAVAILABLE:
            errorState = 'error';
            break;
        }
        
        resolve({ data: null, error: errorState });
      },
      options
    );
  });
}

/**
 * Normalize street name for consistent storage
 */
function normalizeStreetName(street: string): string {
  if (!street) return '';
  
  return street
    .trim()
    // Remove extra commas and spaces
    .replace(/,+/g, ',')
    .replace(/\s+/g, ' ')
    // Convert to Title Case
    .split(' ')
    .map(word => {
      // Keep abbreviations uppercase
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    // Remove trailing comma
    .replace(/,\s*$/, '')
    // Common abbreviations
    .replace(/\bRd\b\.?/gi, 'Road')
    .replace(/\bSt\b\.?/gi, 'Street')
    .replace(/\bAve\b\.?/gi, 'Avenue')
    .replace(/\bBlvd\b\.?/gi, 'Boulevard')
    .replace(/\bDr\b\.?/gi, 'Drive')
    .replace(/\bLn\b\.?/gi, 'Lane')
    .replace(/\bCt\b\.?/gi, 'Court')
    .replace(/\bPl\b\.?/gi, 'Place')
    .replace(/\bM\.?G\.?\b/gi, 'MG');
}

/**
 * Extract street name from address components
 */
function extractStreetName(address: any): string {
  // Try different fields in order of preference
  const streetFields = [
    address.road,
    address.street,
    address.pedestrian,
    address.footway,
    address.path,
    address.highway,
  ];

  for (const field of streetFields) {
    if (field) {
      return normalizeStreetName(field);
    }
  }

  // Fallback to area + suburb
  const fallback = [address.neighbourhood, address.suburb, address.district]
    .filter(Boolean)
    .join(' ');

  return fallback ? normalizeStreetName(fallback) : '';
}

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 * Free, no API key required, privacy-respecting
 */
export async function reverseGeocode(
  coordinates: LocationCoordinates
): Promise<{
  data: LocationAddress | null;
  error: string | null;
}> {
  try {
    const { latitude, longitude } = coordinates;
    
    // Use Nominatim API (free OpenStreetMap geocoding)
    const url = `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `zoom=18&` +
      `addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'CommunityWasteReportingApp/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (!data.address) {
      throw new Error('No address found for this location');
    }

    const address = data.address;
    
    // Extract street name with fallback logic
    let street_name = extractStreetName(address);
    
    // If still no street name, try using building + suburb
    if (!street_name) {
      const fallbackComponents = [
        address.building,
        address.suburb || address.neighbourhood,
      ].filter(Boolean);
      
      if (fallbackComponents.length > 0) {
        street_name = normalizeStreetName(fallbackComponents.join(' '));
      }
    }

    // Extract city (try multiple fields)
    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality || 
      address.county ||
      'Unknown City';

    // Validate we have minimum required data
    if (!street_name) {
      return {
        data: null,
        error: 'Unable to identify street name from location. Please enter manually.',
      };
    }

    return {
      data: {
        street_name: normalizeStreetName(street_name),
        city: normalizeStreetName(city),
        state: address.state,
        postal_code: address.postcode,
        full_address: data.display_name,
      },
      error: null,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get address from location',
    };
  }
}

/**
 * Complete location detection workflow
 * Gets coordinates and converts to address
 */
export async function detectLocation(): Promise<{
  data: LocationResult | null;
  error: string | null;
  state: LocationState;
}> {
  // Step 1: Get coordinates
  const { data: coordinates, error: coordError } = await getCurrentLocation();
  
  if (coordError || !coordinates) {
    return {
      data: null,
      error: getErrorMessage(coordError || 'error'),
      state: coordError || 'error',
    };
  }

  // Step 2: Reverse geocode
  const { data: address, error: geoError } = await reverseGeocode(coordinates);
  
  if (geoError || !address) {
    return {
      data: null,
      error: geoError || 'Failed to determine address',
      state: 'geocoding-failed',
    };
  }

  return {
    data: {
      coordinates,
      address,
      source: 'auto',
    },
    error: null,
    state: 'success',
  };
}

/**
 * Validate manually entered location data
 */
export function validateManualLocation(streetName: string, city: string): {
  valid: boolean;
  error: string | null;
} {
  const trimmedStreet = streetName.trim();
  const trimmedCity = city.trim();

  if (!trimmedStreet || trimmedStreet.length < 3) {
    return {
      valid: false,
      error: 'Please enter a valid street name (minimum 3 characters)',
    };
  }

  if (!trimmedCity || trimmedCity.length < 2) {
    return {
      valid: false,
      error: 'Please enter a valid city name',
    };
  }

  return { valid: true, error: null };
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(state: LocationState): string {
  switch (state) {
    case 'permission-denied':
      return 'Location permission denied. Please enable location access in your browser settings or enter the location manually.';
    case 'timeout':
      return 'Location detection timed out. Please try again or enter the location manually.';
    case 'unsupported':
      return 'Your browser does not support location detection. Please enter the location manually.';
    case 'geocoding-failed':
      return 'Unable to identify street name from your location. Please enter it manually.';
    default:
      return 'Unable to detect location. Please enter the location manually.';
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: LocationCoordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Calculate distance between two coordinates (in km)
 * Useful for validating manual location against detected coordinates
 */
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
