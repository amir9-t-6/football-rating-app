import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	// Dev-friendly warning so it's obvious when keys are missing
	// eslint-disable-next-line no-console
	console.warn(
		"Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Authentication requests will fail until configured."
	);
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
export const supabaseConfigValid = Boolean(supabaseUrl && supabaseAnonKey);