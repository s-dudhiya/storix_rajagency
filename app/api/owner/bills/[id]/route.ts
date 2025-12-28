import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: bill, error } = await supabase
      .from("bills")
      .select(
        `
        *,
        bill_items (
          *
        )
      `,
      )
      .eq("id", id)
      .single()

    if (error || !bill) {
      return Response.json({ error: "Bill not found" }, { status: 404 })
    }

    return Response.json(bill)
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

    // Get order_id before deleting bill
    const { data: bill } = await supabase.from("bills").select("order_id").eq("id", id).single()

    const { error: itemsError } = await supabase.from("bill_items").delete().eq("bill_id", id)

    if (itemsError) {
      console.error("[v0] Failed to delete bill items:", itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 })
    }

    const { error } = await supabase.from("bills").delete().eq("id", id)

    if (error) {
      console.error("[v0] Bill deletion error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Use order_id from fetched bill data
    if (bill?.order_id) {
      // Delete order items associated with the order
      const { error: orderItemsError } = await supabase.from("order_items").delete().eq("order_id", bill.order_id)
      if (orderItemsError) {
        console.error("[v0] Failed to delete order items:", orderItemsError)
      }

      // Delete the order itself
      const { error: orderError } = await supabase.from("orders").delete().eq("id", bill.order_id)
      if (orderError) {
        console.error("[v0] Failed to delete order:", orderError)
      }
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
