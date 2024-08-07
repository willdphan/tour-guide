import type { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

// CONTAINS FULL ACCESS TO THE DATABASE, CAN MAKE BACKEND AND DATABASE CHANGES
// It uses the SUPABASE_SERVICE_ROLE_KEY instead of the anon key. This key has much higher privileges.
// The admin client can bypass Row Level Security (RLS) and perform actions that regular users can't.
// admin client has full database access

// FOR BACKEND TASKS, SYSTEM-LEVEL OPS WHICH INCLUDE BULK DATA UPDATES AND DATABASE SCHEMA CHANGES

export const supabaseAdminClient = createClient<Database>(
  getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  getEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY') // full access
);
