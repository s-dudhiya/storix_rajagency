import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Fetch order with customer info and created_by user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          name,
          shop_name,
          phone
        ),
        created_by_user:users!orders_created_by_fkey (
          full_name
        )
      `)
      .eq("id", id)
      .single()

    if (orderError || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 })
    }

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products (
          product_name
        )
      `)
      .eq("order_id", id)

    if (itemsError) {
      console.error("[v0] Order items fetch error:", itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 })
    }

    return Response.json({
      ...order,
      order_items: orderItems || [],
    })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { order_status } = body

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        order_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        customers (
          name,
          shop_name,
          phone
        ),
        created_by_user:users!orders_created_by_fkey (
          full_name
        )
      `)
      .single()

    if (error) {
      console.error("[v0] Order update error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Fetch order items again
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        *,
        products (
          product_name
        )
      `)
      .eq("order_id", id)

    return Response.json({
      ...order,
      order_items: orderItems || [],
    })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Delete associated bill if it exists
    const { data: bill } = await supabase.from("bills").select("id").eq("order_id", id).single()

    if (bill) {
      // Delete bill items
      const { error: billItemsError } = await supabase.from("bill_items").delete().eq("bill_id", bill.id)
      if (billItemsError) {
        console.error("[v0] Failed to delete bill items:", billItemsError)
      }

      // Delete bill
      const { error: billError } = await supabase.from("bills").delete().eq("id", bill.id)
      if (billError) {
        console.error("[v0] Failed to delete bill:", billError)
      }
    }

    // Delete order items first
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", id)

    if (itemsError) {
      console.error("[v0] Failed to delete order items:", itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 })
    }

    // Delete order
    const { error } = await supabase.from("orders").delete().eq("id", id)

    if (error) {
      console.error("[v0] Order deletion error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
