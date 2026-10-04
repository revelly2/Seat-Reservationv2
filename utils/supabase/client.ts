import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zjadkrmaksbbjcxvikqk.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4MPA3lZQJt_Umh5LfIlrdw_9flfROw6";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
