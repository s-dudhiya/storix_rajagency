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
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/labour/orders">
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft size={18} />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                Order <span className="text-muted-foreground font-medium">#{orderData.id.slice(0, 8)}</span>
              </h1>
              <p className="text-xs font-medium text-muted-foreground hidden md:block">
                Order details view
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${orderData.order_status.toLowerCase() === 'delivered'
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : orderData.order_status.toLowerCase() === 'cancelled'
                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}
            >
              {orderData.order_status}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Customer & Order Info */}
            <div className="space-y-6 md:col-span-2">
              {/* Customer Information */}
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-border/40 pb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="font-bold text-xs">C</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Customer Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                    <p className="text-foreground font-medium">{orderData.customers?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shop Name</p>
                    <p className="text-foreground">{orderData.customers?.shop_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-foreground">{orderData.customers?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">Order Items</h3>
                  <span className="text-xs font-medium text-muted-foreground">{orderData.order_items.length} items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/10 border-b border-border/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {orderData.order_items.map((item: OrderItem) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-foreground font-medium">
                            {item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown Item"}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-muted-foreground capitalize font-medium">
                            {item.unit_type}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-foreground font-medium bg-muted/10">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-muted-foreground">₹{item.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                            ₹{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-muted/10 border-t border-border/50 flex justify-end">
                  <div className="flex items-center gap-4 text-lg">
                    <span className="font-semibold text-muted-foreground">Total:</span>
                    <span className="font-bold text-primary">₹{orderData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Meta & Actions */}
            <div className="space-y-6">
              {/* Order Meta */}
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 border-b border-border/40 pb-2">Order Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Order Date</span>
                    <span className="font-medium">{new Date(orderData.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="font-medium">{orderData.created_by_user?.full_name || "Owner"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Generated Bill</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {orderData.bills?.[0]?.bill_number || "Not Generated"}
                    </span>
                  </div>
                </div>

                {orderData.notes && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-500">
                      {orderData.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Actions */}
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground mb-2">Actions</h3>
                <div className="grid grid-cols-2 gap-3 pt-2">
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
                    className="w-full border-border/60"
                    variant="outline"
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
                    className="w-full border-border/60"
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <MobileNav role="labour" />
    </div>
  )
}
