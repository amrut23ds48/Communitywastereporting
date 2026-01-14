export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory = 'fire' | 'medical' | 'flood' | 'infrastructure' | 'supplies_needed' | 'general';

export type IncidentStatus = 'open' | 'dispatched' | 'on_scene' | 'resolved' | 'false_report';

export interface Incident {
    id: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    description: string;
    image_url: string | null;
    latitude: number;
    longitude: number;
    status: IncidentStatus;
    user_id: string | null;
    street_name: string;
    city: string;
    severity: Severity;
    category: IncidentCategory;
}

export type ResourceType = 'ambulance' | 'personnel' | 'supplies' | 'equipment' | 'shelter' | 'other';

export type ResourceStatus = 'available' | 'dispatched' | 'depleted' | 'maintenance';

export interface Resource {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    type: ResourceType;
    quantity: number;
    latitude: number;
    longitude: number;
    status: ResourceStatus;
    contact_info?: string;
    agency_id?: string;
}
