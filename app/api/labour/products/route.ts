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

    // Labour users have read-only access to all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("brand_name", { ascending: true })
      .order("product_name", { ascending: true })

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
