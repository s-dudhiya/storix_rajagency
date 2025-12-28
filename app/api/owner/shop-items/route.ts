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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { brand_name, product_name, selling_price, stock_pieces } = body

    if (!brand_name || !product_name || !selling_price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: shopItem, error } = await supabase
      .from("shop_items")
      .insert({
        owner_id: user.id,
        brand_name,
        product_name,
        selling_price: Number(selling_price),
        stock_pieces: Number(stock_pieces) || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(shopItem, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating shop item:", error)
    return NextResponse.json({ error: "Failed to create shop item" }, { status: 500 })
  }
}
