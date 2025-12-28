import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { OrderSuccessClient } from "@/components/order-success-client"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_type: string
  price: number
  total: number
  shop_items?: {
    brand_name: string
    product_name: string
  }
}

interface OrderData {
  id: string
  order_date: string
  order_status: string
  total_amount: number
  customers?: {
    name: string
    shop_name: string
    phone: string
  }
  created_by_user?: {
    full_name: string
  }
  order_items: OrderItem[]
  bills?: Array<{
    bill_number: string
  }>
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  console.log("[v0] Owner order-success page loading")
  const params = await searchParams
  const orderId = params.orderId
  console.log("[v0] Order ID:", orderId)

  let orderData: OrderData | null = null

  if (orderId) {
    try {
      const supabase = await createServerClient()
      console.log("[v0] Supabase client created")

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
        *,
        customers (name, shop_name, phone),
        created_by_user:users!orders_created_by_fkey (full_name),
        order_items (
          *,
          shop_items (brand_name, product_name)
        ),
        bills (bill_number)
      `,
        )
        .eq("id", orderId)
        .single()

      if (error) {
        console.error("[v0] Error fetching order:", error)
      } else {
        console.log("[v0] Order data fetched successfully")
        orderData = data
      }
    } catch (error) {
      console.error("[v0] Unexpected error in order-success page:", error)
    }
  }

  if (!orderData) {
    console.log("[v0] No order data found")
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0 p-4 md:p-6">
          <p className="text-red-500">Order not found</p>
          <Link href="/owner/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </main>
        <MobileNav role="owner" />
      </div>
    )
  }

  console.log("[v0] Rendering OrderSuccessClient component")
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <OrderSuccessClient orderData={orderData} role="owner" />
      <MobileNav role="owner" />
    </div>
  )
}
