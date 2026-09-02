import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface NfcPayment {
  id: string;
  card_id: string;
  card_number: string;
  card_holder: string;
  card_brand: string;
  amount: number;
  currency: string;
  merchant: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}
