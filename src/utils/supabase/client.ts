import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Database type definitions
export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          image_url: string;
          latitude: number;
          longitude: number;
          street_name: string;
          city: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'false_report';
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          image_url: string;
          latitude: number;
          longitude: number;
          street_name: string;
          city: string;
          description: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'false_report';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          street_name?: string;
          city?: string;
          description?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'false_report';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
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
      };
      notifications: {
        Row: {
          id: string;
          report_id: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};

// Simple fetch-based Supabase client for Make environment
class SupabaseClient {
  private url: string;
  private key: string;
  private accessToken: string | null = null;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  private getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.accessToken || this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  from(table: string) {
    return {
      select: (columns = '*') => {
        let query = '';
        let filters: any = {};
        
        const builder = {
          eq: (column: string, value: any) => {
            filters[column] = `eq.${value}`;
            return builder;
          },
          neq: (column: string, value: any) => {
            filters[column] = `neq.${value}`;
            return builder;
          },
          gt: (column: string, value: any) => {
            filters[column] = `gt.${value}`;
            return builder;
          },
          gte: (column: string, value: any) => {
            filters[column] = `gte.${value}`;
            return builder;
          },
          lt: (column: string, value: any) => {
            filters[column] = `lt.${value}`;
            return builder;
          },
          lte: (column: string, value: any) => {
            filters[column] = `lte.${value}`;
            return builder;
          },
          like: (column: string, value: any) => {
            filters[column] = `like.${value}`;
            return builder;
          },
          ilike: (column: string, value: any) => {
            filters[column] = `ilike.${value}`;
            return builder;
          },
          in: (column: string, values: any[]) => {
            filters[column] = `in.(${values.join(',')})`;
            return builder;
          },
          order: (column: string, options?: { ascending?: boolean }) => {
            query += `&order=${column}.${options?.ascending ? 'asc' : 'desc'}`;
            return builder;
          },
          limit: (count: number) => {
            query += `&limit=${count}`;
            return builder;
          },
          single: async () => {
            const result = await this.execute();
            if (result.error) return result;
            return { data: result.data?.[0] || null, error: null };
          },
          execute: async () => {
            const filterStr = Object.entries(filters)
              .map(([key, val]) => `${key}=${val}`)
              .join('&');
            
            const url = `${this.url}/rest/v1/${table}?select=${columns}${filterStr ? '&' + filterStr : ''}${query}`;
            
            try {
              const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
              });
              
              if (!response.ok) {
                const error = await response.text();
                return { data: null, error: new Error(error) };
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error: error as Error };
            }
          },
        };
        
        // Make execute the default return
        return new Proxy(builder, {
          get(target: any, prop) {
            if (prop === 'then') {
              return target.execute().then.bind(target.execute());
            }
            return target[prop];
          },
        });
      },
      
      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            try {
              const response = await fetch(`${this.url}/rest/v1/${table}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(values),
              });
              
              if (!response.ok) {
                const error = await response.text();
                return { data: null, error: new Error(error) };
              }
              
              const data = await response.json();
              return { data: data[0] || null, error: null };
            } catch (error) {
              return { data: null, error: error as Error };
            }
          },
        }),
      }),
      
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              try {
                const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
                  method: 'PATCH',
                  headers: this.getHeaders(),
                  body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                  const error = await response.text();
                  return { data: null, error: new Error(error) };
                }
                
                const data = await response.json();
                return { data: data[0] || null, error: null };
              } catch (error) {
                return { data: null, error: error as Error };
              }
            },
          }),
          execute: async () => {
            try {
              const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(values),
              });
              
              if (!response.ok) {
                const error = await response.text();
                return { data: null, error: new Error(error) };
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error: error as Error };
            }
          },
        }),
      }),
      
      delete: () => ({
        eq: (column: string, value: any) => ({
          execute: async () => {
            try {
              const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
              });
              
              if (!response.ok) {
                const error = await response.text();
                return { error: new Error(error) };
              }
              
              return { error: null };
            } catch (error) {
              return { error: error as Error };
            }
          },
        }),
      }),
    };
  }

  get auth() {
    return {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'apikey': this.key,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            return { data: null, error: new Error(error.error_description || 'Login failed') };
          }
          
          const data = await response.json();
          this.accessToken = data.access_token;
          
          return {
            data: {
              user: data.user,
              session: data,
            },
            error: null,
          };
        } catch (error) {
          return { data: null, error: error as Error };
        }
      },
      
      signOut: async () => {
        this.accessToken = null;
        return { error: null };
      },
      
      getSession: async () => {
        if (!this.accessToken) {
          return { data: { session: null }, error: null };
        }
        
        try {
          const response = await fetch(`${this.url}/auth/v1/user`, {
            headers: {
              'apikey': this.key,
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });
          
          if (!response.ok) {
            return { data: { session: null }, error: null };
          }
          
          const user = await response.json();
          return {
            data: {
              session: {
                user,
                access_token: this.accessToken,
              },
            },
            error: null,
          };
        } catch (error) {
          return { data: { session: null }, error: error as Error };
        }
      },
      
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    };
  }

  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, options?: any) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${this.url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.accessToken || this.key}`,
              },
              body: file,
            });
            
            if (!response.ok) {
              const error = await response.text();
              return { error: new Error(error), data: null };
            }
            
            return { error: null, data: { path } };
          } catch (error) {
            return { error: error as Error, data: null };
          }
        },
        
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `${this.url}/storage/v1/object/public/${bucket}/${path}`,
          },
        }),
      }),
    };
  }

  channel(name: string) {
    return {
      on: () => this,
      subscribe: () => this,
      unsubscribe: () => {},
    };
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}