export const MAHARASHTRA_ZONES = {
    KONKAN: 'Konkan',
    PUNE: 'Pune',
    NASHIK: 'Nashik',
    AURANGABAD: 'Aurangabad (Marathwada)',
    AMRAVATI: 'Amravati (Vidarbha)',
    NAGPUR: 'Nagpur (Vidarbha)'
} as const;

export const CITY_ZONE_MAPPING: Record<string, string> = {
    // Konkan Division
    'mumbai': MAHARASHTRA_ZONES.KONKAN,
    'thane': MAHARASHTRA_ZONES.KONKAN,
    'navi mumbai': MAHARASHTRA_ZONES.KONKAN,
    'palghar': MAHARASHTRA_ZONES.KONKAN,
    'raigad': MAHARASHTRA_ZONES.KONKAN,
    'ratnagiri': MAHARASHTRA_ZONES.KONKAN,
    'sindhudurg': MAHARASHTRA_ZONES.KONKAN,
    'panvel': MAHARASHTRA_ZONES.KONKAN,
    'vasai-virar': MAHARASHTRA_ZONES.KONKAN,
    'kalyan-dombivli': MAHARASHTRA_ZONES.KONKAN,

    // Pune Division
    'pune': MAHARASHTRA_ZONES.PUNE,
    'satara': MAHARASHTRA_ZONES.PUNE,
    'sangli': MAHARASHTRA_ZONES.PUNE,
    'kolhapur': MAHARASHTRA_ZONES.PUNE,
    'solapur': MAHARASHTRA_ZONES.PUNE,
    'pimpri-chinchwad': MAHARASHTRA_ZONES.PUNE,

    // Nashik Division
    'nashik': MAHARASHTRA_ZONES.NASHIK,
    'ahmednagar': MAHARASHTRA_ZONES.NASHIK,
    'dhule': MAHARASHTRA_ZONES.NASHIK,
    'jalgaon': MAHARASHTRA_ZONES.NASHIK,
    'nandurbar': MAHARASHTRA_ZONES.NASHIK,
    'malegaon': MAHARASHTRA_ZONES.NASHIK,

    // Aurangabad Division (Marathwada)
    'aurangabad': MAHARASHTRA_ZONES.AURANGABAD,
    'chhatrapati sambhajinagar': MAHARASHTRA_ZONES.AURANGABAD,
    'jalna': MAHARASHTRA_ZONES.AURANGABAD,
    'beed': MAHARASHTRA_ZONES.AURANGABAD,
    'osmanabad': MAHARASHTRA_ZONES.AURANGABAD,
    'dharashiv': MAHARASHTRA_ZONES.AURANGABAD,
    'nanded': MAHARASHTRA_ZONES.AURANGABAD,
    'latur': MAHARASHTRA_ZONES.AURANGABAD,
    'parbhani': MAHARASHTRA_ZONES.AURANGABAD,
    'hingoli': MAHARASHTRA_ZONES.AURANGABAD,

    // Amravati Division (Vidarbha)
    'amravati': MAHARASHTRA_ZONES.AMRAVATI,
    'akola': MAHARASHTRA_ZONES.AMRAVATI,
    'buldhana': MAHARASHTRA_ZONES.AMRAVATI,
    'yavatmal': MAHARASHTRA_ZONES.AMRAVATI,
    'washim': MAHARASHTRA_ZONES.AMRAVATI,

    // Nagpur Division (Vidarbha)
    'nagpur': MAHARASHTRA_ZONES.NAGPUR,
    'wardha': MAHARASHTRA_ZONES.NAGPUR,
    'bhandara': MAHARASHTRA_ZONES.NAGPUR,
    'gondia': MAHARASHTRA_ZONES.NAGPUR,
    'chandrapur': MAHARASHTRA_ZONES.NAGPUR,
    'gadchiroli': MAHARASHTRA_ZONES.NAGPUR
};

export const ZONE_DISTRICTS: Record<string, string[]> = {
    [MAHARASHTRA_ZONES.KONKAN]: ['Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'Navi Mumbai', 'Panvel'],
    [MAHARASHTRA_ZONES.PUNE]: ['Pune', 'Satara', 'Sangli', 'Kolhapur', 'Solapur'],
    [MAHARASHTRA_ZONES.NASHIK]: ['Nashik', 'Ahmednagar', 'Dhule', 'Jalgaon', 'Nandurbar'],
    [MAHARASHTRA_ZONES.AURANGABAD]: ['Chhatrapati Sambhajinagar', 'Jalna', 'Parbhani', 'Hingoli', 'Beed', 'Nanded', 'Dharashiv', 'Latur'],
    [MAHARASHTRA_ZONES.AMRAVATI]: ['Amravati', 'Akola', 'Buldhana', 'Washim', 'Yavatmal'],
    [MAHARASHTRA_ZONES.NAGPUR]: ['Nagpur', 'Wardha', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli']
};

export function getDistrictsForZone(zone: string): string[] {
    return ZONE_DISTRICTS[zone] || [];
}

export function getZoneForCity(city: string): string {
    if (!city) return 'Unknown';
    const normalizedCity = city.toLowerCase().trim();
    // Direct match
    if (CITY_ZONE_MAPPING[normalizedCity]) {
        return CITY_ZONE_MAPPING[normalizedCity];
    }

    // Partial match check (fallback)
    for (const [key, value] of Object.entries(CITY_ZONE_MAPPING)) {
        if (normalizedCity.includes(key)) return value;
    }

    return 'Unknown';
}
