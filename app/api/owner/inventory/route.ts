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

    const { data: products, error } = await supabase.from("products").select("*").order("sr_no", { ascending: true })

    if (error) {
      console.error("[v0] Products fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(products || [])
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
    const { brand_name, product_name, stock_quantity } = body

    if (!brand_name || !product_name) {
      return Response.json({ error: "Brand and product name are required" }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        owner_id: user.id,
        brand_name,
        product_name,
        price_piece: 0,
        price_carton: 0,
        stock_quantity: stock_quantity || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Product creation error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(product)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
