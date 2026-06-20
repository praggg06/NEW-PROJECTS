import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://ezvsjgdptjxdnfayjzgq.supabase.co";

const supabaseKey =
  "sb_publishable_DTDsJz-S3WaXt3z9ukfqWA_i3-iXl-Q"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);