// app/api/events/route.ts

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("body", body);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        starts_at: body.starts_at,
        ends_at: body.ends_at,
        title: body.title,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ event: data });
  } catch (err: any) {
    // Return JSON error details (do not leak secrets).
    const message = err?.message || "Internal server error";
    console.error("/api/sessions error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}