import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://mtslxysbwtlyoltrxmch.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10c2x4eXNid3RseW9sdHJ4bWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzUwMTUsImV4cCI6MjA5ODA1MTAxNX0.idC_KygBHP9YYzIq3K4WRNM_OK1RUhEmtTq3zkUEADI";

// Create Supabase client with AsyncStorage for persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Initialize auth - Supabase anonymous sign-in for data access
export const initializeAuthIfNeeded = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      console.log("Signed in anonymously to Supabase");
    } else {
      console.log("User already authenticated:", data.session.user.id);
    }
  } catch (error) {
    console.error("Error initializing auth:", error);
  }
};