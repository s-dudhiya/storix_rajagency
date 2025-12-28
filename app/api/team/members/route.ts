import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase service role key is not configured")
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("role", ["owner", "labour"])
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json(data || [])
  } catch (err: any) {
    console.error("[v0] Error fetching team members:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { name, email, phone, role, password } = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing Supabase credentials")
      throw new Error("Supabase service role key is not configured")
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log("[v0] Creating auth user for:", email)

    // Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role,
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      throw authError
    }

    if (!authData?.user) {
      throw new Error("Failed to create auth user")
    }

    console.log("[v0] Auth user created, creating profile...")

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email,
      full_name: name,
      phone: phone || null,
      role,
      is_active: true,
    })

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    if (role === "labour") {
      const { error: labourError } = await supabaseAdmin.from("labour_users").insert({
        user_id: authData.user.id,
        owner_id: user.id,
        name: name,
        phone: phone || null,
        is_active: true,
      })

      if (labourError) {
        console.error("[v0] Labour user error:", labourError)
        // Rollback: delete profile and auth user
        await supabaseAdmin.from("users").delete().eq("id", authData.user.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw labourError
      }
    }

    console.log("[v0] Team member created successfully")
    return Response.json({ success: true })
  } catch (err: any) {
    console.error("[v0] Error creating team member:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
