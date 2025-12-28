import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          name,
          shop_name,
          phone,
          area
        ),
        created_by_user:users!orders_created_by_fkey (
          full_name,
          role
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_type,
          price,
          total,
          products (
            product_name,
            brand_name
          )
        )
      `)
      .eq("id", params.id)
      .eq("created_by", user.id)
      .single()

    if (error) {
      console.error("[v0] Order fetch error:", error)
      return Response.json({ error: error.message }, { status: 404 })
    }

    return Response.json(order)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { order_status } = body

    const { data, error } = await supabase
      .from("orders")
      .update({ order_status })
      .eq("id", params.id)
      .eq("created_by", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Order update error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(data)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { error } = await supabase.from("orders").delete().eq("id", params.id).eq("created_by", user.id)

    if (error) {
      console.error("[v0] Order delete error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
