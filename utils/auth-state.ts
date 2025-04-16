import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

// Cache for auth state
let cachedSession: Session | null = null;
let cachedUser: User | null = null;
let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 60000; // 1 minute cache

// Centralized function to get session with caching
export const getSession = async (forceRefresh = false): Promise<Session | null> => {
  const now = Date.now();
  
  // Return cached session if it's still valid and not forcing refresh
  if (!forceRefresh && cachedSession && (now - lastAuthCheck < AUTH_CACHE_TTL)) {
    return cachedSession;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    // Update cache
    cachedSession = data.session;
    cachedUser = data.session?.user || null;
    lastAuthCheck = now;
    
    return data.session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
};

// Centralized function to get user with caching
export const getUser = async (forceRefresh = false): Promise<User | null> => {
  // If we have a cached user and not forcing refresh, return it
  if (!forceRefresh && cachedUser) {
    return cachedUser;
  }
  
  // Get fresh session which will update the cache
  await getSession(forceRefresh);
  return cachedUser;
};

// Function to clear the cache (useful after sign out)
export const clearAuthCache = () => {
  cachedSession = null;
  cachedUser = null;
  lastAuthCheck = 0;
};

// Set up a single auth state change listener
let authListenerInitialized = false;

export const initializeAuthListener = (callback: (event: string, session: Session | null) => void) => {
  if (authListenerInitialized) return;
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Update cache
    cachedSession = session;
    cachedUser = session?.user || null;
    lastAuthCheck = Date.now();
    
    // Call the callback
    callback(event, session);
  });
  
  authListenerInitialized = true;
  
  return () => {
    subscription.unsubscribe();
    authListenerInitialized = false;
  };
}; 