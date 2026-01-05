import { createClient } from '../utils/supabase/client';

export async function signInCitizen(email: string, pass: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });

    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

export async function signUpCitizen(email: string, pass: string, fullName: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          role: 'citizen'
        }
      }
    });

    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}