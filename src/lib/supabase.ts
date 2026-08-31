/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuration Supabase manquante : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
}

// Client Supabase unifié et typé
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fonction de test de connexion et de santé de la base de données
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('categories').select('nom').limit(1);
    if (error) {
      console.warn('Supabase database connection warning or tables missing:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase client error:', err);
    return false;
  }
}

