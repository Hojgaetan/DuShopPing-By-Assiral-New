import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// Define the User Profile structure matching our Supabase public.utilisateurs table
export interface UserProfile {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  role: 'Acheteur' | 'Vendeur' | 'Admin';
  boutiqueId?: string | null;
  photo_profil_url?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, data: { nom: string; telephone?: string; role: 'Acheteur' | 'Vendeur' }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  // Legacy methods (mapping to new ones or kept for compatibility during migration)
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { nom: string; email: string; telephone?: string; password: string; isVendeur: boolean }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch full profile from public.utilisateurs
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*, vendeurs(boutiques(id))')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        // Extraction sécurisée de l'ID de boutique selon la structure retournée par PostgREST
        const vendeursData = Array.isArray(data.vendeurs) ? data.vendeurs[0] : data.vendeurs;
        const boutiquesArray = vendeursData?.boutiques;
        const boutiqueId = Array.isArray(boutiquesArray) ? boutiquesArray[0]?.id : boutiquesArray?.id;

        // Map database response to UserProfile interface
        return {
          id: data.id,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          role: data.type_utilisateur as 'Acheteur' | 'Vendeur' | 'Admin',
          boutiqueId: boutiqueId || null,
          photo_profil_url: null
        };
      }
      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
  };

  // Restore session and listen for auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    initializeAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(true);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, role: data.user.user_metadata?.role };
    } catch (err: any) {
      return { success: false, error: err.message || 'Une erreur est survenue' };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    data: { nom: string; telephone?: string; role: 'Acheteur' | 'Vendeur'; nom_boutique?: string; localisation?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: data.nom,
            telephone: data.telephone,
            role: data.role,
            nom_boutique: data.nom_boutique,
            localisation: data.localisation
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Une erreur est survenue' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  // Legacy mappings
  const login = signIn;
  const register = async (data: { nom: string; email: string; telephone?: string; password: string; isVendeur: boolean; nomBoutique?: string; localisation?: string }): Promise<{ success: boolean; error?: string; role?: string }> => {
    const result = await signUp(data.email, data.password, {
      nom: data.nom,
      telephone: data.telephone,
      role: data.isVendeur ? 'Vendeur' : 'Acheteur',
      nom_boutique: data.nomBoutique,
      localisation: data.localisation
    });
    return { ...result, role: data.isVendeur ? 'Vendeur' : 'Acheteur' };
  };
  const logout = signOut;

  const updateUser = async (data: Partial<UserProfile>) => {
    // In a real Supabase app, we'd update the public.utilisateurs table
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('utilisateurs')
        .update({
          nom: data.nom,
          telephone: data.telephone,
          photo_profil_url: data.photo_profil_url
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signUp, signOut, updateUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
