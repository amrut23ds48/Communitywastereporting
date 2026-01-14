import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';
import {
  IncidentStatus,
  IncidentCategory,
  Severity,
  ResourceType,
  ResourceStatus
} from '../../types';

const supabaseUrl = `https://${projectId}.supabase.co`;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_actions: {
        Row: {
          id: string
          admin_id: string | null
          report_id: string | null
          previous_status: string
          new_status: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          report_id?: string | null
          previous_status: string
          new_status: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          report_id?: string | null
          previous_status?: string
          new_status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          }
        ]
      }
      citizen_activity: {
        Row: {
          id: string
          citizen_id: string
          report_id: string | null
          activity_type: string
          points_awarded: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          citizen_id: string
          report_id?: string | null
          activity_type: string
          points_awarded?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          citizen_id?: string
          report_id?: string | null
          activity_type?: string
          points_awarded?: number
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citizen_activity_citizen_id_fkey"
            columns: ["citizen_id"]
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citizen_activity_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          }
        ]
      }
      citizens: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          total_points: number
          current_level: number
          rank_title: string
          total_reports: number
          resolved_reports: number
          neighborhood: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          total_points?: number
          current_level?: number
          rank_title?: string
          total_reports?: number
          resolved_reports?: number
          neighborhood?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          total_points?: number
          current_level?: number
          rank_title?: string
          total_reports?: number
          resolved_reports?: number
          neighborhood?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citizens_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      incidents: {
        Row: {
          id: string
          image_url: string
          latitude: number
          longitude: number
          street_name: string
          city: string
          description: string | null
          status: IncidentStatus
          created_at: string
          updated_at: string
          resolved_at: string | null
          waste_type: string
          urgency: string
          zone: string | null
          citizen_id: string | null
          severity: Severity | null
          category: IncidentCategory | null
        }
        Insert: {
          id?: string
          image_url: string
          latitude: number
          longitude: number
          street_name: string
          city: string
          description?: string | null
          status?: IncidentStatus
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          waste_type?: string
          urgency?: string
          zone?: string | null
          citizen_id?: string | null
          severity?: Severity | null
          category?: IncidentCategory | null
        }
        Update: {
          id?: string
          image_url?: string
          latitude?: number
          longitude?: number
          street_name?: string
          city?: string
          description?: string | null
          status?: IncidentStatus
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          waste_type?: string
          urgency?: string
          zone?: string | null
          citizen_id?: string | null
          severity?: Severity | null
          category?: IncidentCategory | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_citizen_id_fkey"
            columns: ["citizen_id"]
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          report_id: string | null
          message: string
          type: string
          is_read: boolean | null
          created_at: string
          citizen_id: string | null
        }
        Insert: {
          id?: string
          report_id?: string | null
          message: string
          type: string
          is_read?: boolean | null
          created_at?: string
          citizen_id?: string | null
        }
        Update: {
          id?: string
          report_id?: string | null
          message?: string
          type?: string
          is_read?: boolean | null
          created_at?: string
          citizen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_citizen_id_fkey"
            columns: ["citizen_id"]
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: {
          id: string
          name: string
          type: ResourceType
          quantity: number | null
          latitude: number
          longitude: number
          status: ResourceStatus | null
          contact_info: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: ResourceType
          quantity?: number | null
          latitude: number
          longitude: number
          status?: ResourceStatus | null
          contact_info?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: ResourceType
          quantity?: number | null
          latitude?: number
          longitude?: number
          status?: ResourceStatus | null
          contact_info?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      citizen_leaderboard: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          total_points: number
          current_level: number
          rank_title: string
          total_reports: number
          resolved_reports: number
          city: string | null
          neighborhood: string | null
          global_rank: number
          city_rank: number | null
          neighborhood_rank: number | null
        }
      }
      citizen_stats: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          total_points: number
          current_level: number
          rank_title: string
          total_reports: number
          resolved_reports: number
          neighborhood: string | null
          city: string | null
          points_to_next_level: number | null
          current_level_points: number
          global_rank: number
          city_rank: number | null
          neighborhood_rank: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      report_status: IncidentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Create Supabase client using official @supabase/supabase-js
 * This automatically handles CORS and provides all Supabase features
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, publicAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}