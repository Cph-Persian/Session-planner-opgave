// lib/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function initClient(): SupabaseClient {
	if (_client) return _client;

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

	// Prefer the public anon key for client-side usage. Accept several common env names.
	const anonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.SUPABASE_SERVICE_ANON_KEY ||
		process.env.SUPABASE_ANON_KEY ||
		process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !anonKey) {
		throw new Error(
			"Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ANON_KEY)"
		);
	}

	_client = createClient(url, anonKey);
	return _client;
}

// Export a proxy so importing modules won't throw during module evaluation.
export const supabase: SupabaseClient = new Proxy(
	{},
	{
		get(_, prop) {
			const c = initClient();
			// @ts-ignore
			return c[prop as keyof SupabaseClient];
		},
		set(_, prop, value) {
			const c = initClient();
			// @ts-ignore
			c[prop as keyof SupabaseClient] = value;
			return true;
		},
	}
) as unknown as SupabaseClient;

export function getSupabase(): SupabaseClient {
	return initClient();
}