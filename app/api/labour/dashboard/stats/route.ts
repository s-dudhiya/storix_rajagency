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

    // Get labour user's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayOrdersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .gte("order_date", today.toISOString())

    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { count: monthOrdersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .gte("order_date", thisMonth.toISOString())

    return Response.json({
      todayOrders: todayOrdersCount || 0,
      totalOrders: totalOrders || 0,
      monthOrders: monthOrdersCount || 0,
    })
  } catch (error: any) {
    console.error("[v0] Stats fetch error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
