import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { is_active } = await req.json()

    const { error } = await supabase.from("users").update({ is_active }).eq("id", id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentUser } = await supabase.from("users").select("id, role").eq("id", user.id).single()

    if (!currentUser || currentUser.role !== "owner") {
      return Response.json({ error: "Only owners can delete team members" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: "Server configuration error: Missing Supabase credentials" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      return Response.json({ error: `Error fetching user: ${fetchError.message}` }, { status: 500 })
    }

    if (!userToDelete) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    if (userToDelete.role === "owner") {
      const { count: ownerCount } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "owner")

      if (ownerCount && ownerCount <= 1) {
        return Response.json(
          {
            error: "Cannot delete the last owner. At least one owner account must remain in the system.",
          },
          { status: 400 },
        )
      }

      const { data: anotherOwner } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "owner")
        .neq("id", id)
        .limit(1)
        .single()

      if (!anotherOwner) {
        return Response.json(
          {
            error: "Cannot find another owner to reassign data to.",
          },
          { status: 500 },
        )
      }

      const reassignToOwnerId = anotherOwner.id

      await supabaseAdmin.from("shop_items").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)
      await supabaseAdmin.from("customers").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)
      await supabaseAdmin.from("products").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)

      // Update orders - owner_id
      await supabaseAdmin.from("orders").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)
      // Update orders - created_by
      await supabaseAdmin.from("orders").update({ created_by: reassignToOwnerId }).eq("created_by", id)

      // Update bills - owner_id
      await supabaseAdmin.from("bills").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)
      // Update bills - created_by
      await supabaseAdmin.from("bills").update({ created_by: reassignToOwnerId }).eq("created_by", id)

      await supabaseAdmin.from("labour_users").update({ owner_id: reassignToOwnerId }).eq("owner_id", id)

      const { error: userError } = await supabaseAdmin.from("users").delete().eq("id", id)

      if (userError) {
        return Response.json({ error: `Failed to delete user: ${userError.message}` }, { status: 500 })
      }

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

      if (authError) {
        console.error("Auth deletion warning:", authError)
      }

      return Response.json({ success: true })
    }

    await supabaseAdmin.from("shop_items").update({ owner_id: currentUser.id }).eq("owner_id", id)
    await supabaseAdmin.from("customers").update({ owner_id: currentUser.id }).eq("owner_id", id)
    await supabaseAdmin.from("products").update({ owner_id: currentUser.id }).eq("owner_id", id)

    // Update orders - owner_id
    await supabaseAdmin.from("orders").update({ owner_id: currentUser.id }).eq("owner_id", id)
    // Update orders - created_by
    await supabaseAdmin.from("orders").update({ created_by: currentUser.id }).eq("created_by", id)

    // Update bills - owner_id
    await supabaseAdmin.from("bills").update({ owner_id: currentUser.id }).eq("owner_id", id)
    // Update bills - created_by
    await supabaseAdmin.from("bills").update({ created_by: currentUser.id }).eq("created_by", id)

    await supabaseAdmin.from("labour_users").delete().eq("user_id", id)

    const { error: userError } = await supabaseAdmin.from("users").delete().eq("id", id)

    if (userError) {
      return Response.json({ error: `Failed to delete user: ${userError.message}` }, { status: 500 })
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      console.error("Auth deletion warning:", authError)
    }

    return Response.json({ success: true })
  } catch (err: any) {
    console.error("Delete member error:", err)
    return Response.json({ error: err.message || "Failed to delete member" }, { status: 500 })
  }
}
