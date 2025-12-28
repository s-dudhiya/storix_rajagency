import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { stock_quantity, price_piece, price_carton } = body

    const { data: product, error } = await supabase
      .from("products")
      .update({
        stock_quantity,
        price_piece,
        price_carton,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Product update error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(product)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { error: itemsDeleteError } = await supabase.from("order_items").delete().eq("product_id", id)

    if (itemsDeleteError) {
      console.error("[v0] Failed to delete related order items:", itemsDeleteError)
      return Response.json({ error: "Cannot delete product with existing orders" }, { status: 400 })
    }

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("[v0] Product deletion error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
