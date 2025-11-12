// app/api/sessions/route.ts

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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    console.log("DELETE request for session ID:", sessionId);

    const supabase = getSupabaseAdmin();

    // First check if session exists and get its title
    const { data: existingSession, error: checkError } = await supabase
      .from("sessions")
      .select("id, title")
      .eq("id", sessionId)
      .single();

    if (checkError || !existingSession) {
      console.log("Session not found or check error:", checkError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("Session found, attempting deletion:", existingSession);

    // Delete the session using service role (bypasses RLS)
    // Note: Service role key should have "role": "service_role" in JWT
    const { data: deleteData, error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId)
      .select();

    console.log("Delete result:", { deleteData, deleteError });
    
    // Check if service role is actually being used
    if (deleteError && (deleteError.message?.includes("permission") || deleteError.message?.includes("policy"))) {
      console.error("RLS policy blocking deletion. Service role key may not be configured correctly.");
      console.error("Make sure SUPABASE_SERVICE_ROLE_KEY has 'role': 'service_role' in the JWT token");
    }

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Verify deletion by checking if it still exists
    const { data: verifyData, error: verifyError } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();

    console.log("Verification after delete:", { verifyData, verifyError });

    if (verifyData) {
      console.error("Session still exists after deletion - RLS policy may be blocking");
      return NextResponse.json({ 
        error: "Session could not be deleted. Check RLS policies in Supabase." 
      }, { status: 500 });
    }

    // If no error and verification shows it's gone, deletion was successful
    return NextResponse.json({ 
      success: true, 
      deleted: { id: sessionId, title: existingSession.title } 
    });
  } catch (err: any) {
    const message = err?.message || "Internal server error";
    console.error("/api/sessions DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}