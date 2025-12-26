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

// Generic builder for Supabase requests
class QueryBuilder {
  private url: string;
  private headers: any;
  private method: string;
  private body: any;
  private filters: Record<string, string> = {};
  private queryParams: string = '';
  private isSingle: boolean = false;

  constructor(url: string, headers: any, method: string = 'GET', body: any = null) {
    this.url = url;
    this.headers = headers;
    this.method = method;
    this.body = body;
  }

  // Filters
  eq(column: string, value: any) {
    this.filters[column] = `eq.${value}`;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[column] = `neq.${value}`;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[column] = `gt.${value}`;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[column] = `gte.${value}`;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[column] = `lt.${value}`;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[column] = `lte.${value}`;
    return this;
  }

  like(column: string, value: any) {
    this.filters[column] = `like.${value}`;
    return this;
  }

  ilike(column: string, value: any) {
    this.filters[column] = `ilike.${value}`;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[column] = `in.(${values.join(',')})`;
    return this;
  }

  is(column: string, value: any) {
    this.filters[column] = `is.${value}`;
    return this;
  }

  // Modifiers
  order(column: string, options?: { ascending?: boolean }) {
    this.queryParams += `&order=${column}.${options?.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(count: number) {
    this.queryParams += `&limit=${count}`;
    return this;
  }

  // Helper to retrieve data + count, usually just returns self in this mock
  select(columns: string = '*') {
    if (this.method === 'POST' || this.method === 'PATCH') {
      this.queryParams += `&select=${columns}`;
    }
    // If it's a GET, the columns are usually set in constructor, but we can append/overwrite if needed
    // For simplicity in this mock, we assume GETs start with select.
    return this;
  }

  single() {
    this.isSingle = true;
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    return this;
  }

  // Execution
  async execute() {
    const filterStr = Object.entries(this.filters)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    // Construct final URL
    // If it's a select (GET), we need ?select=* if not present, but for simplicity:
    let finalUrl = this.url;
    const separator = this.url.includes('?') ? '&' : '?';

    const params = [filterStr, this.queryParams].filter(Boolean).join('&');
    if (params) {
      finalUrl += `${separator}${params}`;
    }

    try {
      const response = await fetch(finalUrl, {
        method: this.method,
        headers: this.headers,
        body: this.body ? JSON.stringify(this.body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: new Error(errorText) };
      }

      // DELETE usually returns 204 No Content, unless select() is chained
      if (this.method === 'DELETE' && !this.queryParams.includes('select')) {
        return { data: null, error: null };
      }

      const data = await response.json();

      // Handle .single() automatic unpacking if API didn't do it (fallback)
      if (this.isSingle && Array.isArray(data)) {
        return { data: data.length > 0 ? data[0] : null, error: null };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Make the builder Thenable so it can be awaited directly
  then(onfulfilled?: ((value: any) => any), onrejected?: ((reason: any) => any)) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class SupabaseClient {
  private url: string;
  private key: string;
  private accessToken: string | null = null;
  private authListeners: Array<(event: string, session: any) => void> = [];

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
    // Try to recover session from localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('sb-access-token');
    }
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
    const baseUrl = `${this.url}/rest/v1/${table}`;

    return {
      select: (columns = '*') => {
        return new QueryBuilder(`${baseUrl}?select=${columns}`, this.getHeaders(), 'GET');
      },

      insert: (values: any) => {
        return new QueryBuilder(baseUrl, this.getHeaders(), 'POST', values);
      },

      update: (values: any) => {
        return new QueryBuilder(baseUrl, this.getHeaders(), 'PATCH', values);
      },

      delete: () => {
        return new QueryBuilder(baseUrl, this.getHeaders(), 'DELETE');
      },
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

          if (typeof window !== 'undefined') {
            localStorage.setItem('sb-access-token', this.accessToken!);
          }

          const session = { user: data.user, access_token: data.access_token };
          this.notifyListeners('SIGNED_IN', session);

          return {
            data: {
              user: data.user,
              session: session,
            },
            error: null,
          };
        } catch (error) {
          return { data: null, error: error as Error };
        }
      },

      signOut: async () => {
        this.accessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sb-access-token');
        }
        this.notifyListeners('SIGNED_OUT', null);
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
        this.authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                this.authListeners = this.authListeners.filter(cb => cb !== callback);
              },
            },
          },
        };
      },
    };
  }

  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (path: string, file: File | Blob, options?: any) => {
          try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.accessToken || this.key}`,
              },
              body: formData,
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
    const channelInstance = {
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        return channelInstance;
      },
      subscribe: () => {
        return {
          unsubscribe: () => { }
        };
      },
    };
    return channelInstance;
  }

  removeChannel(channel: any) {
    // No-op for now
  }

  private notifyListeners(event: string, session: any) {
    this.authListeners.forEach(listener => listener(event, session));
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}