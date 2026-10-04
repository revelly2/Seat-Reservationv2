import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjadkrmaksbbjcxvikqk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4MPA3lZQJt_Umh5LfIlrdw_9flfROw6';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
