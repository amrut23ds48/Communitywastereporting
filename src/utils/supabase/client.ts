import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Database type definitions (keep this!)
export type Database = {
  public: {
    Tables: {
      incidents: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          description: string;
          image_url: string | null;
          latitude: number;
          longitude: number;
          status: 'open' | 'dispatched' | 'on_scene' | 'resolved' | 'false_report';
          user_id: string | null;
          street_name: string;
          city: string;
          category: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          description: string;
          image_url: string;
          latitude: number;
          longitude: number;
          status?: 'open' | 'dispatched' | 'on_scene' | 'resolved' | 'false_report';
          user_id?: string | null;
          street_name: string;
          city: string;
          category: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          description?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          status?: 'open' | 'dispatched' | 'on_scene' | 'resolved' | 'false_report';
          user_id?: string | null;
          street_name?: string;
          city?: string;
          category?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          type: 'ambulance' | 'personnel' | 'supplies' | 'equipment' | 'shelter' | 'other';
          quantity: number;
          latitude: number;
          longitude: number;
          status: 'available' | 'dispatched' | 'depleted' | 'maintenance';
          contact_info: string | null;
          agency_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          type: 'ambulance' | 'personnel' | 'supplies' | 'equipment' | 'shelter' | 'other';
          quantity?: number;
          latitude: number;
          longitude: number;
          status?: 'available' | 'dispatched' | 'depleted' | 'maintenance';
          contact_info?: string | null;
          agency_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          type?: 'ambulance' | 'personnel' | 'supplies' | 'equipment' | 'shelter' | 'other';
          quantity?: number;
          latitude?: number;
          longitude?: number;
          status?: 'available' | 'dispatched' | 'depleted' | 'maintenance';
          contact_info?: string | null;
          agency_id?: string | null;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          report_id: string;
          previous_status: string;
          new_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          report_id: string;
          previous_status: string;
          new_status: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          report_id: string;
          citizen_id: string | null;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          citizen_id?: string | null;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      citizens: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          neighborhood: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          total_points?: number;
          current_level?: number;
          rank_title?: string;
          total_reports?: number;
          resolved_reports?: number;
          neighborhood?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          total_points?: number;
          current_level?: number;
          rank_title?: string;
          total_reports?: number;
          resolved_reports?: number;
          neighborhood?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      citizen_activity: {
        Row: {
          id: string;
          citizen_id: string;
          report_id: string | null;
          activity_type: string;
          points_awarded: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          citizen_id: string;
          report_id?: string | null;
          activity_type: string;
          points_awarded?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          citizen_id?: string;
          report_id?: string | null;
          activity_type?: string;
          points_awarded?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      citizen_leaderboard: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          city: string | null;
          neighborhood: string | null;
          global_rank: number;
          city_rank: number | null;
          neighborhood_rank: number | null;
        };
      };
      citizen_stats: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          neighborhood: string | null;
          city: string | null;
          points_to_next_level: number | null;
          current_level_points: number;
          global_rank: number;
          city_rank: number | null;
          neighborhood_rank: number | null;
        };
      };
      Functions: {
        [_ in never]: never;
      };
      Enums: {
        [_ in never]: never;
      };
      CompositeTypes: {
        [_ in never]: never;
      };
    };
  };

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