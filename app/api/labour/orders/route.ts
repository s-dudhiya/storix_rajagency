import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          name,
          shop_name,
          phone
        ),
        created_by_user:users!orders_created_by_fkey (
          full_name,
          role
        )
      `)
      .eq("created_by", user.id)
      .order("order_date", { ascending: false })

    if (error) {
      console.error("[v0] Orders fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(orders || [])
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { customer_id, items, total_amount } = body

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        owner_id: user.id,
        customer_id,
        created_by: user.id,
        total_amount,
        order_status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order creation error:", orderError)
      return Response.json({ error: orderError.message }, { status: 400 })
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_type: "piece",
      price: item.price,
      total: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Order items creation error:", itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 })
    }

    // Get customer details for bill
    const { data: customer } = await supabase
      .from("customers")
      .select("name, shop_name, phone")
      .eq("id", customer_id)
      .single()

    // Generate bill number
    const { data: billNumberData } = await supabase.rpc("generate_bill_number")
    const billNumber = billNumberData || `BILL-${Date.now()}`

    // Create bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        bill_number: billNumber,
        owner_id: user.id,
        order_id: order.id,
        customer_id: customer_id,
        customer_name: customer?.name || "Unknown",
        shop_name: customer?.shop_name,
        phone: customer?.phone,
        total_amount,
        bill_type: "app_order",
        created_by: user.id,
      })
      .select()
      .single()

    if (billError) {
      console.error("[v0] Bill creation error:", billError)
    } else {
      const billItems = items.map((item: any) => ({
        bill_id: bill.id,
        // product_id: item.id, // Removed to prevent silent failure if column doesn't exist
        item_name: item.brand_name ? `${item.brand_name} ${item.product_name}` : item.product_name,
        quantity: item.quantity,
        unit_type: "piece",
        price: item.price,
        total: item.price * item.quantity,
      }))

      const { error: billItemsError } = await supabase.from("bill_items").insert(billItems)

      if (billItemsError) {
        console.error("[v0] Bill items creation error:", billItemsError)
        // Don't silence the error - let the user know something is wrong with bill generation
        // But since order is created, maybe we shouldn't fail the whole request?
        // Ideally we should fail, but for now let's at least log it loudly.
        // Actually, if bill items fail, the bill is useless. Let's return error.
        return Response.json({ error: `Order created but failed to generate bill items: ${billItemsError.message}` }, { status: 400 })
      }
    }

    return Response.json(order)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
