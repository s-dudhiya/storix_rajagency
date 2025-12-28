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
        id,
        total_amount,
        order_status,
        order_date,
        customers (
          name,
          shop_name
        )
      `)
      .order("order_date", { ascending: false })
      .limit(5)

    if (error) {
      console.error("[v0] Orders fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Format the response
    const formattedOrders =
      orders?.map((order) => ({
        id: order.id,
        customer_name: order.customers?.name || "Unknown",
        shop_name: order.customers?.shop_name || "Unknown",
        total_amount: order.total_amount,
        order_status: order.order_status,
        order_date: order.order_date,
      })) || []

    return Response.json(formattedOrders)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
