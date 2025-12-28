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

    // Get customers - labour users see all customers (shared pool)
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Customers fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(customers || [])
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
