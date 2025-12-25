# Location Detection System - Technical Documentation

## Overview

The Community Waste Reporting Platform implements a privacy-first, robust location detection system that automatically identifies the street and city where waste is reported. The system is designed for anonymous citizen reporting with strict privacy controls.

## Architecture

### Components

1. **`/utils/location.ts`** - Core location service
   - Browser Geolocation API wrapper
   - Reverse geocoding via Nominatim (OpenStreetMap)
   - Data normalization and validation
   - Error handling

2. **`/components/CitizenDashboard.tsx`** - UI integration
   - State management
   - User flow orchestration
   - Manual fallback UI
   - Form validation

## Data Flow

```
1. Citizen uploads image
   ↓
2. Auto-trigger location request
   ↓
3. Browser requests permission (one-time)
   ↓
4. Get coordinates (lat, lng, accuracy)
   ↓
5. Reverse geocode to address
   ↓
6. Normalize street name & city
   ↓
7. Display in UI (with edit option)
   ↓
8. Submit to Supabase with coordinates
```

## Privacy & Security

### ✅ Privacy Guarantees

- **Single-use detection**: Location requested only when user uploads image
- **No background tracking**: No continuous polling or monitoring
- **No storage of identity**: Coordinates stored with report, not user
- **Anonymous reporting**: No user accounts or login required
- **Transparent usage**: Clear explanation shown to users

### 🔒 What We Store

**In Supabase `reports` table:**
```sql
{
  latitude: number,
  longitude: number,
  street_name: string,
  city: string,
  image_url: string,
  description: string,
  status: 'open'
}
```

**What We DON'T Store:**
- User identity
- Device identifiers
- IP addresses
- Location history
- Precise coordinates beyond street-level

## Location Detection States

```typescript
type LocationState = 
  | 'idle'                  // Initial state
  | 'requesting-permission' // Waiting for user permission
  | 'detecting'            // Getting GPS coordinates
  | 'geocoding'            // Converting to address
  | 'success'              // Location detected successfully
  | 'permission-denied'    // User denied permission
  | 'timeout'              // GPS timeout
  | 'unsupported'          // Browser doesn't support geolocation
  | 'geocoding-failed'     // Address not found
  | 'error'                // Other error
```

## Reverse Geocoding

### Provider: Nominatim (OpenStreetMap)

**Why Nominatim?**
- ✅ Free and open-source
- ✅ No API key required
- ✅ Privacy-respecting
- ✅ Good global coverage
- ✅ Accurate street-level data

**API Endpoint:**
```
https://nominatim.openstreetmap.org/reverse?
  format=json
  &lat={latitude}
  &lon={longitude}
  &zoom=18
  &addressdetails=1
```

**Rate Limits:**
- 1 request per second
- User-Agent header required
- Consider self-hosting for production

### Address Extraction Logic

The system tries multiple fields in order:

1. **Primary**: `road`, `street`
2. **Secondary**: `pedestrian`, `footway`, `path`
3. **Fallback**: `neighbourhood`, `suburb`, `district`
4. **City**: `city`, `town`, `village`, `municipality`

## Data Normalization

### Street Name Normalization

Ensures consistent naming for analytics and aggregation.

**Rules:**
```javascript
1. Trim whitespace
2. Convert to Title Case
3. Remove extra commas
4. Standardize abbreviations:
   - "Rd" → "Road"
   - "St" → "Street"
   - "Ave" → "Avenue"
   - "Blvd" → "Boulevard"
   - "Dr" → "Drive"
   - "M.G." → "MG"
5. Remove landmark-only names
```

**Examples:**
```
Input:  "m.g. rd, andheri east"
Output: "MG Road"

Input:  "OAK   AVE"
Output: "Oak Avenue"

Input:  "123 main st."
Output: "Main Street"
```

## User Flows

### Flow 1: Successful Auto-Detection

```
1. User uploads image
   → "Detecting location..." (blue spinner)
   
2. Permission granted
   → "Getting address..." (blue spinner)
   
3. Address found
   → Green success box with:
      - Street name
      - City
      - Accuracy (±meters)
      - "Edit" button
      
4. User can submit report
```

### Flow 2: Permission Denied

```
1. User uploads image
   → "Detecting location..." (blue spinner)
   
2. Permission denied
   → Red error box:
      "Location permission denied. Please enable..."
      [Enter Location Manually] button
      
3. User clicks manual entry
   → Yellow form with:
      - Street Name input
      - City input
      - [Confirm Location] button
      - [Try Auto-Detect] button
      
4. User enters location manually
   → Green success state
   
5. User can submit report
```

### Flow 3: Geocoding Failed

```
1. User uploads image
   → Coordinates detected successfully
   
2. Reverse geocoding fails
   → Red error box:
      "Unable to identify street name from location..."
      [Enter Location Manually] button
      
3. User enters location manually
   → Green success state
   
4. User can submit report
```

## UI States

### Idle
- No location activity
- Image upload button visible

### Detecting
```jsx
<div className="bg-blue-50">
  <Loader2 className="animate-spin" />
  <p>Detecting location...</p>
  <p>This will help identify your street</p>
</div>
```

### Success (Auto)
```jsx
<div className="bg-green-50 border-green-200">
  <CheckCircle />
  <p>Location detected</p>
  <div>
    Street: {street_name}
    City: {city}
    Accuracy: ±{accuracy}m
  </div>
  <button>Edit</button>
</div>
```

### Success (Manual)
```jsx
<div className="bg-green-50 border-green-200">
  <CheckCircle />
  <p>Location confirmed</p>
  <div>
    Street: {street_name}
    City: {city}
    Source: Manual entry
  </div>
  <button>Edit</button>
</div>
```

### Error
```jsx
<div className="bg-red-50 border-red-200">
  <AlertCircle />
  <p>{error_message}</p>
  <button>Enter Location Manually</button>
</div>
```

### Manual Entry
```jsx
<div className="bg-yellow-50 border-yellow-200">
  <AlertCircle />
  <p>Manual Location Entry</p>
  <p>We only use your location to identify the street...</p>
  
  <input placeholder="Street Name" />
  <input placeholder="City" />
  
  <button>Confirm Location</button>
  <button>Try Auto-Detect</button>
</div>
```

## Validation

### Client-Side Validation

```typescript
validateManualLocation(street: string, city: string) {
  if (street.length < 3) {
    return { valid: false, error: "Street name too short" }
  }
  if (city.length < 2) {
    return { valid: false, error: "City name too short" }
  }
  return { valid: true, error: null }
}
```

### Server-Side Validation (Supabase)

```sql
ALTER TABLE reports ADD CONSTRAINT 
  street_name_length CHECK (length(street_name) >= 3);

ALTER TABLE reports ADD CONSTRAINT 
  city_length CHECK (length(city) >= 2);
```

## Error Handling

### Timeout (10 seconds)
```
Error: "Location detection timed out. Please try again 
        or enter the location manually."
Action: Show manual entry form
```

### Permission Denied
```
Error: "Location permission denied. Please enable location 
        access in your browser settings or enter manually."
Action: Show manual entry form + browser settings hint
```

### Unsupported Browser
```
Error: "Your browser does not support location detection. 
        Please enter the location manually."
Action: Show manual entry form immediately
```

### Geocoding Failed
```
Error: "Unable to identify street name from your location. 
        Please enter it manually."
Action: Show manual entry form with coordinates preserved
```

## Testing Scenarios

### Test Case 1: Happy Path
1. Upload image
2. Grant permission
3. Wait for detection
4. Verify street + city displayed
5. Submit report
6. Verify data in Supabase

### Test Case 2: Permission Denied
1. Upload image
2. Deny permission
3. Verify error message
4. Click manual entry
5. Enter street + city
6. Submit report

### Test Case 3: Edit Auto-Detected
1. Upload image
2. Location detected
3. Click "Edit"
4. Modify street name
5. Confirm
6. Submit report

### Test Case 4: Network Failure
1. Upload image
2. Turn off network during geocoding
3. Verify error handling
4. Reconnect network
5. Retry detection

### Test Case 5: Invalid Coordinates
1. Mock invalid coordinates
2. Trigger detection
3. Verify fallback to manual entry

## Performance Considerations

### Optimization Strategies

1. **Single Detection**: Only trigger once per image upload
2. **Timeout Control**: 10 second max for GPS
3. **Caching**: Store detected location during session
4. **Debouncing**: Prevent multiple simultaneous requests
5. **User Agent**: Required by Nominatim

### Expected Performance

- **GPS Detection**: 2-5 seconds
- **Reverse Geocoding**: 1-2 seconds
- **Total Time**: 3-7 seconds average

## Production Recommendations

### 1. Self-Host Nominatim
- Better rate limits
- More control
- Lower latency
- Privacy guarantee

### 2. Add Forward Geocoding
```typescript
// Convert manual entry to coordinates
async function geocodeAddress(street: string, city: string) {
  // Use Nominatim forward geocoding
  // Store real coordinates instead of fallback
}
```

### 3. Add Location Verification
```typescript
// Verify manual entry is reasonable
function verifyLocation(street: string, city: string, coords: Coordinates) {
  const distance = calculateDistance(coords, knownCityCenter);
  if (distance > 50km) {
    return { valid: false, warning: "Location seems far from city" }
  }
}
```

### 4. Add Analytics
- Track detection success rate
- Monitor geocoding failures
- Identify problem areas
- Optimize fallback logic

### 5. Improve Street Extraction
```typescript
// Use ML/AI for better street name extraction
// Handle edge cases:
// - Gated communities
// - Large complexes
// - Rural areas
// - New developments
```

## Privacy Compliance

### GDPR Compliance
✅ Minimal data collection
✅ Clear user consent
✅ Transparent usage
✅ No tracking
✅ Anonymous reporting

### Best Practices
- Explain why location is needed
- Show what data is collected
- Allow manual entry alternative
- Don't store historical locations
- Aggregate for analytics only

## Monitoring & Debugging

### Key Metrics
- Location detection success rate
- Geocoding API success rate
- Average detection time
- Permission denial rate
- Manual entry usage rate

### Debug Logging
```typescript
console.log('[Location] State:', state);
console.log('[Location] Coordinates:', lat, lng);
console.log('[Location] Address:', street, city);
console.log('[Location] Source:', auto | manual);
```

## Future Enhancements

### Planned Features
1. **Offline Support**: Cache recent streets
2. **Better Fallbacks**: Use IP geolocation as backup
3. **Smart Suggestions**: Autocomplete for manual entry
4. **Location Verification**: Cross-check with known streets
5. **Multi-language**: Support local language street names
6. **Better Accuracy**: Use PostGIS for advanced queries

---

## Quick Reference

**Trigger**: Image upload or explicit user action
**Permission**: Requested once per session
**Timeout**: 10 seconds
**Fallback**: Manual entry always available
**Storage**: Only street-level data
**Privacy**: Anonymous, single-use detection
**API**: Nominatim (OpenStreetMap)
**Normalization**: Automatic, consistent naming
