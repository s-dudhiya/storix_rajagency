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
        order_date,
        total_amount,
        order_status,
        customers (
          name,
          shop_name
        )
      `)
      .eq("created_by", user.id)
      .order("order_date", { ascending: false })
      .limit(5)

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
