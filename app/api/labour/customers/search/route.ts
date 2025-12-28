import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return Response.json({ error: "Phone parameter required" }, { status: 400 })
    }

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .ilike("phone", `%${phone}%`)
      .limit(5)

    if (error) {
      console.error("[v0] Customer search error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(customers || [])
  } catch (error: any) {
    console.error("[v0] Route error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
