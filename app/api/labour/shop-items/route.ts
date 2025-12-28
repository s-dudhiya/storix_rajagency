import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: shopItems, error } = await supabase.from("shop_items").select("*").order("sr_no", { ascending: true })

    if (error) throw error

    return NextResponse.json(shopItems)
  } catch (error) {
    console.error("[v0] Error fetching shop items:", error)
    return NextResponse.json({ error: "Failed to fetch shop items" }, { status: 500 })
  }
}
