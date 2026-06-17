import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User Profile structure
export interface UserProfile {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  role: 'Acheteur' | 'Vendeur';
  boutiqueId?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: { nom: string; email: string; telephone?: string; password: string; isVendeur: boolean }) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage "database"
function getStoredUsers(): Array<UserProfile & { password: string }> {
  const raw = localStorage.getItem('dushop_users_db');
  return raw ? JSON.parse(raw) : [];
}

function saveStoredUsers(users: Array<UserProfile & { password: string }>) {
  localStorage.setItem('dushop_users_db', JSON.stringify(users));
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('dushop_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email && u.password === password);

    if (!found) {
      return { success: false, error: 'Email ou mot de passe incorrect.' };
    }

    const { password: _, ...profile } = found;
    setUser(profile);
    localStorage.setItem('dushop_session', JSON.stringify(profile));
    return { success: true };
  };

  const register = (data: { nom: string; email: string; telephone?: string; password: string; isVendeur: boolean }): { success: boolean; error?: string } => {
    const users = getStoredUsers();

    // Check if email already exists
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'Un compte avec cet email existe déjà.' };
    }

    const newId = 'user-' + Date.now();
    const boutiqueId = data.isVendeur ? 'boutique-' + Date.now() : null;

    const newUser = {
      id: newId,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      role: (data.isVendeur ? 'Vendeur' : 'Acheteur') as 'Vendeur' | 'Acheteur',
      boutiqueId,
      password: data.password,
    };

    users.push(newUser);
    saveStoredUsers(users);

    // If vendor, also create a boutique entry
    if (data.isVendeur && boutiqueId) {
      const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
      boutiques.push({
        id: boutiqueId,
        vendeur_id: newId,
        nom: 'Ma Boutique',
        description: '',
        localisation: '',
        logo_url: '',
      });
      localStorage.setItem('dushop_boutiques_db', JSON.stringify(boutiques));
    }

    const { password: _, ...profile } = newUser;
    setUser(profile);
    localStorage.setItem('dushop_session', JSON.stringify(profile));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dushop_session');
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('dushop_session', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
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
