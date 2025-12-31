import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { PrintBillButton } from "@/components/print-bill-button"
import { DownloadBillButton } from "@/components/download-bill-button"

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

interface OrderDetails {
  id: string
  order_date: string
  order_status: string
  total_amount: number
  notes?: string
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

export default async function LabourOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createServerClient()

  const { data: orderData, error } = await supabase
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
    .eq("id", id)
    .single()

  if (error || !orderData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="labour" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-red-500">Order not found</p>
            <Link href="/labour/orders">
              <Button className="mt-4">Back to Orders</Button>
            </Link>
          </div>
        </main>
        <MobileNav role="labour" />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
    }
  }

  const subtotal = orderData.order_items.reduce((sum: number, item: OrderItem) => sum + item.total, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="labour" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:p-6 md:sticky md:top-0 md:z-40">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/labour/orders">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ChevronLeft size={18} />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Order {orderData.id.slice(0, 8)}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(orderData.order_date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(orderData.order_status)}`}
            >
              {orderData.order_status.charAt(0).toUpperCase() + orderData.order_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          {/* Customer Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Customer Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Name</p>
                  <p className="text-foreground font-medium">{orderData.customers?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Shop Name</p>
                  <p className="text-foreground">{orderData.customers?.shop_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Phone</p>
                  <p className="text-foreground">{orderData.customers?.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Order Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Order ID</p>
                  <p className="text-foreground font-medium">{orderData.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Date</p>
                  <p className="text-foreground">{new Date(orderData.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Status</p>
                  <p className="text-foreground">{orderData.order_status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-muted border-b border-border">
              <h3 className="font-bold text-foreground">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Item</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-foreground">Unit</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-foreground">Qty</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-foreground">Price</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.order_items.map((item: OrderItem) => (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-3 text-sm text-foreground font-medium">
                        {item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown"}
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-muted-foreground">{item.unit_type}</td>
                      <td className="px-6 py-3 text-center text-sm text-foreground">{item.quantity}</td>
                      <td className="px-6 py-3 text-right text-sm text-foreground">Rs. {item.price}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-foreground">Rs. {item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Additional Notes</h3>
              <p className="text-sm text-foreground bg-muted rounded-md p-3">{orderData.notes || "No notes added"}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Order Total</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary">Rs. {orderData.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <PrintBillButton
              billData={{
                bill_number: orderData.bills?.[0]?.bill_number || `ORD-${orderData.id.slice(0, 8)}`,
                bill_date: orderData.order_date,
                customer_name: orderData.customers?.name || "N/A",
                shop_name: orderData.customers?.shop_name || undefined,
                phone: orderData.customers?.phone || undefined,
                items: orderData.order_items.map((item: OrderItem) => ({
                  item_name: item.shop_items
                    ? `${item.shop_items.brand_name} ${item.shop_items.product_name}`
                    : "Unknown",
                  quantity: item.quantity,
                  unit_type: item.unit_type,
                  price: item.price,
                  total: item.total,
                })),
                total_amount: orderData.total_amount,
              }}
              className="flex-1"
            />
            <DownloadBillButton
              billData={{
                bill_number: orderData.bills?.[0]?.bill_number || `ORD-${orderData.id.slice(0, 8)}`,
                bill_date: orderData.order_date,
                customer_name: orderData.customers?.name || "N/A",
                shop_name: orderData.customers?.shop_name || undefined,
                phone: orderData.customers?.phone || undefined,
                items: orderData.order_items.map((item: OrderItem) => ({
                  item_name: item.shop_items
                    ? `${item.shop_items.brand_name} ${item.shop_items.product_name}`
                    : "Unknown",
                  quantity: item.quantity,
                  unit_type: item.unit_type,
                  price: item.price,
                  total: item.total,
                })),
                total_amount: orderData.total_amount,
              }}
              className="flex-1"
              variant="outline"
            />
            {/* Removed redundant standalone Print button as PrintBillButton handles it */}
          </div>
        </div>
      </main>
      <MobileNav role="labour" />
    </div>
  )
}
