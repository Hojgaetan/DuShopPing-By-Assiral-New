import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { resolveProfileRole } from '../lib/mappers';

// Define the User Profile structure matching our Supabase public.utilisateurs table
export interface UserProfile {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  role: 'Vendeur' | 'Entreprise' | 'Admin';
  adminRole?: 'SuperAdmin' | 'Moderateur' | 'Commercial';
  accountStatus: string;
  boutiqueId?: string | null;
  photo_profil_url?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserProfile['role'] }>;
  signUp: (email: string, password: string, data: { nom: string; telephone?: string; role: 'Vendeur' | 'Entreprise' }) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  // Legacy methods (mapping to new ones or kept for compatibility during migration)
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserProfile['role'] }>;
  register: (data: { nom: string; email: string; telephone?: string; password: string; accountType?: 'Vendeur' | 'Entreprise'; nomBoutique?: string; localisation?: string }) => Promise<{ success: boolean; error?: string; role?: string; requiresEmailConfirmation?: boolean }>;
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
        .select('*, vendeurs(boutiques(id)), administrateurs(role)')
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
        const adminData = Array.isArray(data.administrateurs)
          ? data.administrateurs[0]
          : data.administrateurs;

        // Map database response to UserProfile interface
        return {
          id: data.id,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          role: resolveProfileRole(data.type_utilisateur, adminData),
          adminRole: adminData?.role,
          accountStatus: data.statut_compte || 'Actif',
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
        if (profile?.accountStatus === 'Actif') {
          setUser(profile);
        } else {
          await supabase.auth.signOut();
          setSupabaseUser(null);
          setUser(null);
        }
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
        if (profile?.accountStatus === 'Actif') {
          setUser(profile);
        } else {
          setUser(null);
        }
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

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserProfile['role'] }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      const profile = await fetchProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Profil utilisateur introuvable.' };
      }
      if (profile.accountStatus !== 'Actif') {
        await supabase.auth.signOut();
        return { success: false, error: 'Ce compte est suspendu ou désactivé.' };
      }
      setSupabaseUser(data.user);
      setUser(profile);
      return { success: true, role: profile?.role };
    } catch (err: any) {
      return { success: false, error: err.message || 'Une erreur est survenue' };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    data: { nom: string; telephone?: string; role: 'Vendeur' | 'Entreprise'; nom_boutique?: string; localisation?: string }
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
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
      return { success: true, requiresEmailConfirmation: !authData.session };
    } catch (err: any) {
      return { success: false, error: err.message || 'Une erreur est survenue' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { success: false, error: error.message } : { success: true };
  };

  // Legacy mappings
  const login = signIn;
  const register = async (data: { nom: string; email: string; telephone?: string; password: string; accountType?: 'Vendeur' | 'Entreprise'; nomBoutique?: string; localisation?: string }): Promise<{ success: boolean; error?: string; role?: string; requiresEmailConfirmation?: boolean }> => {
    const result = await signUp(data.email, data.password, {
      nom: data.nom,
      telephone: data.telephone,
      role: data.accountType || 'Vendeur',
      nom_boutique: data.nomBoutique,
      localisation: data.localisation
    });
    return { ...result, role: data.accountType || 'Vendeur' };
  };
  const logout = signOut;

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const { data: updatedProfile, error } = await supabase.rpc('update_my_profile', {
      profile_name: data.nom ?? user.nom,
      profile_phone: data.telephone ?? user.telephone ?? '',
    });
    if (error) throw error;

    setUser(prev => prev ? {
      ...prev,
      nom: updatedProfile.nom,
      telephone: updatedProfile.telephone || undefined,
    } : null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signUp, signOut, requestPasswordReset, updatePassword, updateUser, login, register, logout }}>
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
