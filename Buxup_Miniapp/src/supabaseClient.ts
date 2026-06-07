import { createClient } from '@supabase/supabase-js';

// Extraemos las variables secretas que guardamos en el archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos y exportamos la conexión para poder usarla en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);