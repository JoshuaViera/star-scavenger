// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Note the function name change here
export const createClient = () => createClientComponentClient();