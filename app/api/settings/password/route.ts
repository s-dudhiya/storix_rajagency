import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { phone, newPassword } = body

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("phone")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
    }

    // Verify phone number matches
    if (profile.phone !== phone) {
      return NextResponse.json({ error: "Mobile number does not match" }, { status: 400 })
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("[v0] Error in password POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
