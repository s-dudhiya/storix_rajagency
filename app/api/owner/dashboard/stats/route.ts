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

    const { count: brandsCount } = await supabase.from("products").select("brand_name", { count: "exact", head: true })

    const { data: products } = await supabase.from("products").select("brand_name")

    const uniqueBrands = new Set(products?.map((p) => p.brand_name) || [])

    const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayOrdersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("order_date", today.toISOString())

    const { count: lowStockCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lt("stock_quantity", 10)

    return Response.json({
      totalBrands: uniqueBrands.size,
      totalProducts: productsCount || 0,
      todayOrders: todayOrdersCount || 0,
      lowStockAlerts: lowStockCount || 0,
    })
  } catch (error: any) {
    console.error("[v0] Stats fetch error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
