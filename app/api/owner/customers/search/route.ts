import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: customer, error } = await supabase.from("customers").select("*").eq("phone", phone).maybeSingle()

    if (error) {
      console.error("[v0] Customer search error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(customer)
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
