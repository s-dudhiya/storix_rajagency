import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data: shopItem, error } = await supabase
      .from("shop_items")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(shopItem)
  } catch (error) {
    console.error("[v0] Error updating shop item:", error)
    return NextResponse.json({ error: "Failed to update shop item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from("shop_items").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Shop item deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting shop item:", error)
    return NextResponse.json({ error: "Failed to delete shop item" }, { status: 500 })
  }
}
