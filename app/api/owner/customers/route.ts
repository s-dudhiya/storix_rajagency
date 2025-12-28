import { createClient } from "@/lib/supabase/server"

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
    const { name, shop_name, phone, area } = body

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        owner_id: user.id,
        name,
        shop_name,
        phone,
        area: area || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Customer creation error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(customer)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Fetch customers with aggregated order data
    const { data: customers, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        shop_name,
        phone,
        area,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Customers fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // For each customer, calculate total orders and spent
    const customersWithStats = await Promise.all(
      (customers || []).map(async (customer) => {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("customer_id", customer.id)

        if (ordersError) {
          console.error("[v0] Orders fetch error:", ordersError)
          return {
            ...customer,
            total_orders: 0,
            total_spent: 0,
          }
        }

        const total_orders = orders?.length || 0
        const total_spent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        return {
          ...customer,
          total_orders,
          total_spent,
        }
      }),
    )

    return Response.json(customersWithStats)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
