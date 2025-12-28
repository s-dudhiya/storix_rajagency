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

    // Fetch all bills with bill items
    const { data: bills, error } = await supabase
      .from("bills")
      .select(
        `
        *,
        bill_items (
          *
        )
      `,
      )
      .order("bill_date", { ascending: false })

    if (error) {
      console.error("[v0] Bills fetch error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(bills || [])
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
    const { customer_name, shop_name, phone, items, total_amount, notes } = body

    // Generate bill number
    const { data: billNumberData } = await supabase.rpc("generate_bill_number")
    const billNumber = billNumberData || `BILL-${Date.now()}`

    // Create bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        bill_number: billNumber,
        owner_id: user.id,
        customer_name,
        shop_name,
        phone,
        total_amount,
        bill_type: "manual_entry",
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (billError) {
      console.error("[v0] Bill creation error:", billError)
      return Response.json({ error: billError.message }, { status: 400 })
    }

    // Create bill items
    const billItems = items.map((item: any) => ({
      bill_id: bill.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_type: item.unit_type,
      price: item.price,
      total: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from("bill_items").insert(billItems)

    if (itemsError) {
      console.error("[v0] Bill items creation error:", itemsError)
      return Response.json({ error: itemsError.message }, { status: 400 })
    }

    return Response.json(bill)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
