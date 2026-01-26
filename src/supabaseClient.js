import { createClient } from '@supabase/supabase-js'

// Ini akan mengambil kunci rahasia dari settingan Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
