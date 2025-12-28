import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("[v0] Error fetching auth users:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabaseAdmin.from("users").select("id")

    if (dbError) {
      console.error("[v0] Error fetching database users:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const dbUserIds = new Set(dbUsers?.map((u) => u.id) || [])

    // Find orphaned users (in auth but not in database)
    const orphanedUsers = authUsers.users.filter((authUser) => !dbUserIds.has(authUser.id))

    return NextResponse.json({
      orphanedUsers: orphanedUsers.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })),
    })
  } catch (error: any) {
    console.error("[v0] Error in cleanup-orphaned-users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Delete from auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error("[v0] Error deleting orphaned user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in delete orphaned user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
