import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '');

let supabaseInstance: any;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Fallback to a safe proxy if not configured or failed to initialize
if (!supabaseInstance) {
  console.warn(
    'Supabase configuration is missing or invalid. App will run in Setup Mode. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.'
  );

  supabaseInstance = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async () => { 
            return { error: new Error('Supabase is not configured. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') }; 
          },
          signUp: async () => { 
            return { error: new Error('Supabase is not configured. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') }; 
          },
          signOut: async () => { return { error: null }; }
        };
      }
      // Return a function that returns an object with a select/update/etc. that resolves/rejects safely
      const dummyFunc = () => {
        const chain = {
          select: () => chain,
          insert: () => chain,
          update: () => chain,
          delete: () => chain,
          eq: () => chain,
          order: () => chain,
          single: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured.') }),
          then: (resolve: any) => resolve({ data: [], error: new Error('Supabase is not configured.') })
        };
        return chain;
      };
      return dummyFunc;
    }
  }) as any;
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = isConfigured;
