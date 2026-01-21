
import { createClient } from '@supabase/supabase-js';

// Substitua com suas credenciais do Supabase ou use variáveis de ambiente (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oxjqmlmahsdnwjogrksr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94anFtbG1haHNkbndqb2dya3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODI4NjEsImV4cCI6MjA4MTE1ODg2MX0.Az-rzl6cMpdjM5wfFvpLtyepXIIu3DjtF6uKzWHm8w8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
